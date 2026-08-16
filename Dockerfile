# Obraz backendu CVELOCITY dla Google Cloud Run.
#
# Frontend hostuje Vercel, więc domyślnie budujemy tu wyłącznie API (`build:server`).
# Serwer serwuje `dist/client/` tylko wtedy, gdy ten katalog istnieje — żeby zbudować
# obraz self-contained (staging, demo bez Vercela), zamień `build:server` na `build`.

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

RUN npm run build:server

# ---------- etap 2: runtime ----------
FROM node:22-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Bez devDependencies: bundel wymaga w czasie działania tylko express, helmet,
# zod, dotenv, cheerio i @google/genai. Vite jest ładowany dynamicznym importem
# wyłącznie w gałęzi deweloperskiej, więc tutaj nie jest potrzebny.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/dist ./dist

# Kontener nie ma powodu działać jako root. Obraz `node` ma gotowego
# nieuprzywilejowanego użytkownika `node` (uid 1000).
USER node

# Cloud Run wstrzykuje PORT i oczekuje nasłuchu na 0.0.0.0 — `config.ts` czyta
# PORT ze środowiska, a `server.ts` bindiuje 0.0.0.0. Ta wartość jest tylko
# domyślną dla uruchomienia lokalnego.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "--enable-source-maps", "dist/server.mjs"]
