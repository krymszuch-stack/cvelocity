# Obraz CVELOCITY dla Google Cloud Run.
#
# Jeden kontener serwuje frontend i API. Skutek: jeden URL, więc nie ma ruchu
# cross-origin, nie ma CORS do skonfigurowania i nie ma osobnego rachunku za
# hosting frontendu. `server.ts` serwuje `dist/client/` warunkowo (`existsSync`),
# więc ten sam obraz zbudowany bez frontendu działa dalej jako samo API.

# ---------- etap 1: build ----------
# Node 22, nie 20: safeFetch przypina zwalidowane IP przez własny `lookup`
# w `http.request` i cała weryfikacja SSRF była robiona na tej wersji.
FROM node:22-slim AS build

WORKDIR /app

# Warstwa zależności osobno od źródeł — dopóki lockfile się nie zmienia,
# Docker odtwarza ją z cache zamiast instalować od nowa przy każdym buildzie.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Zmienne VITE_ są **wbudowywane w pakiet przeglądarki w trakcie budowania**,
# a nie odczytywane w czasie działania. Przekazanie ich przez `--set-env-vars`
# w `gcloud run deploy` nie zadziała — muszą być tutaj.
#
# Obie są publiczne z definicji: `anon` chroni RLS, a klucz publikowalny Stripe'a
# służy właśnie do umieszczania w kodzie klienta. SUPABASE_SERVICE_ROLE_KEY ani
# STRIPE_SECRET_KEY nie mogą tu trafić nigdy — pierwszy omija całe RLS, drugi
# pozwala obciążać cudze karty.
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ARG VITE_STRIPE_PUBLISHABLE_KEY=""
ARG VITE_API_URL=""
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY \
    VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- etap 2: runtime ----------
FROM node:22-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Bez devDependencies: bundel wymaga w czasie działania tylko express, helmet,
# zod, dotenv, cheerio, @google/genai, @supabase/supabase-js i stripe. Vite jest
# ładowany dynamicznym importem wyłącznie w gałęzi deweloperskiej.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/dist ./dist

# Kontener nie ma powodu działać jako root. Obraz `node` ma gotowego
# nieuprzywilejowanego użytkownika `node` (uid 1000).
USER node

# Cloud Run wstrzykuje PORT i oczekuje nasłuchu na 0.0.0.0 — `config.ts` czyta
# PORT ze środowiska, a `server.ts` binduje 0.0.0.0. Ta wartość jest tylko
# domyślną dla uruchomienia lokalnego.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "--enable-source-maps", "dist/server.mjs"]
