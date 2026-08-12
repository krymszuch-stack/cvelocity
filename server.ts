// Must precede the gemini import so GEMINI_API_KEY from .env is visible to it.
// On Render this is a no-op — dotenv never overrides variables already in the process.
import "dotenv/config";
import express from "express";
import * as cheerio from "cheerio";
import { parseRawCvToVault, optimizeDeltaPhrases, parseJobDescriptionWithGemini, getAdvisorEducationalAdvice, generateCoverLetterWithFlash } from "./src/server/gemini";

/**
 * Filter out web portal navigation noise, links, buttons ("Zobacz ofertę", "Aplikuj", "Pobierz aplikację", cookies, footers)
 */
function filterTextNoiseLines(rawText: string): string {
  if (!rawText) return "";

  const noisePhrases = [
    /zobacz\s+ofertę/i,
    /aplikuj\s+teraz/i,
    /aplikuj\s+na\s+to\s+stanowisko/i,
    /szybkie\s+aplikowanie/i,
    /pobierz\s+aplikację/i,
    /zaloguj\s+się/i,
    /zarejestruj\s+się/i,
    /polityka\s+prywatności/i,
    /polityka\s+cookies/i,
    /zgody\s+marketingowe/i,
    /regulamin/i,
    /obserwuj\s+firmę/i,
    /zapisz\s+do\s+ulubionych/i,
    /zgłoś\s+ogłoszenie/i,
    /podobne\s+oferty/i,
    /sprawdź\s+inne\s+oferty/i,
    /zobacz\s+inne\s+oferty/i,
    /dla\s+pracodawców/i,
    /wszystkie\s+prawa\s+zastrzeżone/i,
    /udostępnij/i,
    /kopiuj\s+link/i,
    /zobacz\s+profil\s+firmy/i,
    /dołącz\s+do\s+naszego\s+zespołu/i,
    /zapisz\s+się\s+do\s+newslettera/i,
    /wróć\s+do\s+listy/i,
    /oferty\s+pracy\s+w\s+mieście/i,
  ];

  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => {
      for (const pattern of noisePhrases) {
        if (pattern.test(line) && line.length < 90) return false;
      }
      return true;
    });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Clean raw HTML from Job Boards (Pracuj.pl, NoFluffJobs, JustJoinIT, LinkedIn, Olx) to pure merytoric body text
 */
function cleanJobHtmlToPureText(htmlOrText: string): string {
  if (!htmlOrText) return "";

  try {
    const $ = cheerio.load(htmlOrText);

    // 1. Check for JSON-LD Schema.org/JobPosting (Cleanest data source on Pracuj.pl, NoFluffJobs, LinkedIn)
    let jsonLdText = "";
    $("script[type='application/ld+json']").each((_, el) => {
      try {
        const rawJson = $(el).contents().text();
        const parsed = JSON.parse(rawJson);
        const jobPosting = Array.isArray(parsed)
          ? parsed.find((item: any) => item['@type'] === 'JobPosting')
          : (parsed && parsed['@type'] === 'JobPosting' ? parsed : null);

        if (jobPosting && jobPosting.description) {
          const cleanDesc = cheerio.load(jobPosting.description).text();
          const title = jobPosting.title || '';
          const org = jobPosting.hiringOrganization?.name || '';
          jsonLdText = `Stanowisko: ${title}\nFirma: ${org}\n\nOpis Oferty i Wymagania:\n${cleanDesc}`;
        }
      } catch {
        // Skip invalid JSON-LD
      }
    });

    if (jsonLdText.length > 100) {
      return filterTextNoiseLines(jsonLdText);
    }

    // Strip script, style, svg, header, footer, nav, aside, cookie banners, sidebars, related cards, action buttons
    $(
      "script, style, svg, noscript, iframe, canvas, header, footer, nav, aside, form, button, input, select, textarea, [role='navigation'], [role='banner'], [role='contentinfo'], [role='dialog'], [aria-label*='cookie' i], [class*='cookie' i], [id*='cookie' i], [class*='footer' i], [id*='footer' i], [class*='header' i], [id*='header' i], [class*='nav' i], [id*='nav' i], [class*='sidebar' i], [id*='sidebar' i], [class*='related' i], [class*='similar' i], [class*='recommend' i], [class*='share' i], [class*='breadcrumb' i], [class*='pagination' i], [class*='ad' i], [class*='banner' i]"
    ).remove();

    // Target main body or article container
    let extractedText = "";
    const mainContainer = $(
      "main, article, [role='main'], .job-offer, .offer-details, .job-description, #job-description, .description, .offer-content, .job-details, .offer-body, [data-test*='offer' i]"
    ).first();

    if (mainContainer.length > 0) {
      extractedText = mainContainer.text();
    } else {
      extractedText = $("body").text() || $.text();
    }

    return filterTextNoiseLines(extractedText);
  } catch (e) {
    const simple = htmlOrText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");
    return filterTextNoiseLines(simple);
  }
}

/** Origins allowed to call this API from a browser. Overridable via ALLOWED_ORIGINS (comma-separated). */
const DEFAULT_ALLOWED_ORIGINS = [
  "https://skillvault-99a72.web.app",
  "https://skillvault-99a72.firebaseapp.com",
  "https://skillvault.oathcry.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : DEFAULT_ALLOWED_ORIGINS)
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean)
);

/**
 * Fixed-window rate limit, per IP, for the Gemini-backed routes.
 * These endpoints spend real money and are publicly reachable once deployed, so
 * an open door here is a billing risk, not just an abuse one. In-memory is enough:
 * the service runs as a single instance.
 */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX !== undefined && Number.isFinite(Number(process.env.RATE_LIMIT_MAX))
  ? Number(process.env.RATE_LIMIT_MAX)
  : 20;
const rateLimitHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  if (RATE_LIMIT_MAX <= 0) return false;
  const now = Date.now();
  const recent = (rateLimitHits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  rateLimitHits.set(ip, recent);

  // Opportunistic sweep so idle IPs don't accumulate forever.
  if (rateLimitHits.size > 5000) {
    for (const [key, times] of rateLimitHits) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) rateLimitHits.delete(key);
    }
  }
  return recent.length >= RATE_LIMIT_MAX;
}

function formatApiError(defaultMessage: string, err: any) {
  const isDev = process.env.NODE_ENV !== "production";
  return {
    error: defaultMessage,
    ...(isDev ? { details: err?.message || String(err) } : {}),
  };
}

/** Per-attempt timeout for outbound scraping. Render kills a request at ~100s. */
const OUTBOUND_TIMEOUT_MS = 12_000;

/**
 * Guards the URL the caller asks us to fetch. Once this API is public, an
 * unvalidated outbound fetch lets anyone use the server as a proxy into private
 * networks (SSRF). Returns an error message, or null when the URL is acceptable.
 */
function validateOutboundUrl(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return "Podaj prawidłowy adres URL ogłoszenia o pracę (http/https).";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Dozwolone są wyłącznie adresy http i https.";
  }

  return validateOutboundHost(parsed.hostname);
}

/**
 * Rejects hostnames that resolve to the machine itself or to private ranges.
 *
 * Works on the NORMALISED host: the same address has many textual spellings, and
 * matching raw text meant `[::ffff:127.0.0.1]` slipped past checks that caught
 * plain `127.0.0.1`. Anything IPv4-mapped is folded back to its IPv4 form first.
 */
function validateOutboundHost(rawHost: string): string | null {
  let host = rawHost.toLowerCase().replace(/^\[|\]$/g, "");

  // IPv4-mapped IPv6 -> bare IPv4. Note that `new URL()` rewrites the readable
  // form `::ffff:127.0.0.1` into hex (`::ffff:7f00:1`), so matching the dotted
  // spelling alone silently misses every real request.
  const mappedHex = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const high = parseInt(mappedHex[1], 16);
    const low = parseInt(mappedHex[2], 16);
    host = [(high >> 8) & 255, high & 255, (low >> 8) & 255, low & 255].join(".");
  }
  const mappedDotted = host.match(/^::(?:ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mappedDotted) host = mappedDotted[1];

  // Decimal / octal / hex spellings of an IPv4 address (e.g. 2130706433, 0177.0.0.1)
  const asInt = /^\d+$/.test(host) ? Number(host) : /^0x[0-9a-f]+$/.test(host) ? parseInt(host, 16) : NaN;
  if (Number.isFinite(asInt) && asInt >= 0 && asInt <= 0xffffffff) {
    host = [(asInt >>> 24) & 255, (asInt >>> 16) & 255, (asInt >>> 8) & 255, asInt & 255].join(".");
  }
  const octal = host.match(/^0\d+(?:\.0*\d+){3}$/);
  if (octal) {
    host = host.split(".").map((p) => String(parseInt(p, 8))).join(".");
  }

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "::1" ||
    host === "::" ||
    host === "0.0.0.0" ||
    /^0\./.test(host) ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host) ||
    /^f[cd][0-9a-f]{2}:/.test(host) ||
    /^fe80:/.test(host)
  ) {
    return "Adresy lokalne i prywatne są niedozwolone.";
  }

  return null;
}

/**
 * fetch() that refuses to be redirected somewhere the caller was not allowed to
 * ask for directly. Validating only the submitted URL is not enough — a permitted
 * public host can answer with `Location: http://127.0.0.1/`.
 */
async function safeOutboundFetch(url: string, init: RequestInit = {}, maxHops = 3): Promise<Response> {
  let current = url;

  for (let hop = 0; hop <= maxHops; hop++) {
    const invalid = validateOutboundUrl(current);
    if (invalid) throw new Error(invalid);

    const response = await fetch(current, { ...init, redirect: "manual" });

    if (response.status < 300 || response.status > 399) return response;

    const location = response.headers.get("location");
    if (!location) return response;

    current = new URL(location, current).toString();
  }

  throw new Error("Zbyt wiele przekierowań przy pobieraniu oferty.");
}

async function startServer() {
  const app = express();
  // Render injects PORT and requires the process to bind to it.
  const PORT = Number(process.env.PORT) || 3000;

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.has(origin.replace(/\/$/, ""))) {
      res.header("Access-Control-Allow-Origin", origin);
      // Required: without it a cache may serve one origin's response to another.
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Max-Age", "86400");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // 2mb is ~20x the largest realistic CV; the old 10mb was a DoS/OOM vector
  // on a 512MB instance.
  app.use(express.json({ limit: "2mb" }));

  // Health check is deliberately exempt — Render probes it and it costs nothing.
  app.use("/api", (req, res, next) => {
    if (req.path === "/health") return next();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (isRateLimited(ip)) {
      res.setHeader("Retry-After", "900");
      return res.status(429).json({
        error: "Zbyt wiele żądań. Odczekaj 15 minut i spróbuj ponownie.",
      });
    }
    next();
  });

  // API Route: Health Check
  app.get("/api/health", (_req, res) => {
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    res.status(hasGeminiKey ? 200 : 503).json({
      status: hasGeminiKey ? "ok" : "degraded",
      gemini: hasGeminiKey ? "ok" : "missing-key",
      service: "SkillVault Core API",
      timestamp: new Date().toISOString(),
    });
  });

  // API Route: Parse Raw Resume Text into Master Vault JSON
  app.post("/api/parse-cv", async (req, res) => {
    try {
      const { rawText } = req.body;
      if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
        return res.status(400).json({ error: "Brak wymaganego tekstu dokumentu do przetworzenia." });
      }

      const parsedVault = await parseRawCvToVault(rawText);
      res.json({ success: true, parsedVault, data: parsedVault });
    } catch (err: any) {
      console.error("Error in /api/parse-cv:", err);
      res.status(502).json(formatApiError("Nie udało się sparsować dokumentu przez API Gemini.", err));
    }
  });

  // API Route: Parse Job Description
  app.post("/api/parse-jd", async (req, res) => {
    try {
      const { rawJdText } = req.body;
      if (!rawJdText || typeof rawJdText !== "string" || rawJdText.trim().length === 0) {
        return res.status(400).json({ error: "Brak treści ogłoszenia o pracę." });
      }

      const parsedJd = await parseJobDescriptionWithGemini(rawJdText);
      res.json({ success: true, parsedJd });
    } catch (err: any) {
      console.error("Error in /api/parse-jd:", err);
      res.status(502).json(formatApiError("Nie udało się sparsować ogłoszenia o pracę.", err));
    }
  });

  // API Route: Fetch and Parse Job Offer URL
  app.post("/api/fetch-jd-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Podaj prawidłowy adres URL ogłoszenia o pracę (http/https)." });
      }

      const urlError = validateOutboundUrl(url);
      if (urlError) {
        return res.status(400).json({ error: urlError });
      }

      console.log(`Fetching job offer URL: ${url}`);

      let fetchedRawText = "";
      let fetchSuccess = false;

      // Tier 1: Direct fetch with browser headers
      try {
        const response = await safeOutboundFetch(url, {
          signal: AbortSignal.timeout(OUTBOUND_TIMEOUT_MS),
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Referer": "https://www.google.com/",
            "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "cross-site",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
          },
        });

        if (response.ok) {
          fetchedRawText = await response.text();
          if (fetchedRawText.length > 100) {
            fetchSuccess = true;
            console.log(`Tier 1 direct fetch succeeded (${fetchedRawText.length} bytes)`);
          }
        } else {
          console.warn(`Tier 1 fetch returned status ${response.status} ${response.statusText}`);
        }
      } catch (t1Err) {
        console.warn("Tier 1 direct fetch failed:", t1Err);
      }

      // Tier 2: Jina AI Reader Proxy (r.jina.ai) for anti-bot / Cloudflare bypass
      if (!fetchSuccess) {
        console.log(`Tier 2: Attempting Jina AI Reader proxy for URL: ${url}`);
        try {
          const jinaUrl = `https://r.jina.ai/${url}`;
          const jinaRes = await fetch(jinaUrl, {
            signal: AbortSignal.timeout(OUTBOUND_TIMEOUT_MS),
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "text/plain, text/html",
              "X-Target-Url": url,
            },
          });
          if (jinaRes.ok) {
            fetchedRawText = await jinaRes.text();
            if (fetchedRawText.length > 100) {
              fetchSuccess = true;
              console.log(`Tier 2 Jina Reader fetch succeeded (${fetchedRawText.length} bytes)`);
            }
          } else {
            console.warn(`Tier 2 Jina Reader status: ${jinaRes.status}`);
          }
        } catch (t2Err) {
          console.warn("Tier 2 Jina Reader failed:", t2Err);
        }
      }

      // Tier 3: CorsProxy fallback
      if (!fetchSuccess) {
        console.log(`Tier 3: Attempting CorsProxy for URL: ${url}`);
        try {
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          const proxyRes = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(OUTBOUND_TIMEOUT_MS),
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });
          if (proxyRes.ok) {
            fetchedRawText = await proxyRes.text();
            if (fetchedRawText.length > 100) {
              fetchSuccess = true;
              console.log(`Tier 3 CorsProxy succeeded (${fetchedRawText.length} bytes)`);
            }
          }
        } catch (t3Err) {
          console.warn("Tier 3 CorsProxy failed:", t3Err);
        }
      }

      // Tier 4: Wayback Machine Digital Archive Fallback (Bypass 404 / Expired / Deleted Job Ads)
      if (!fetchSuccess) {
        console.log(`Tier 4: Attempting Wayback Machine Digital Archive for 404 / Expired URL: ${url}`);
        try {
          const archiveUrl = `https://web.archive.org/web/2/${url}`;
          const archiveRes = await fetch(archiveUrl, {
            signal: AbortSignal.timeout(OUTBOUND_TIMEOUT_MS),
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              "Referer": "https://web.archive.org/",
            },
          });
          if (archiveRes.ok) {
            const archiveText = await archiveRes.text();
            if (archiveText.length > 200) {
              fetchedRawText = archiveText;
              fetchSuccess = true;
              console.log(`Tier 4 Wayback Machine Archive fetch succeeded (${fetchedRawText.length} bytes)`);
            }
          } else {
            console.warn(`Tier 4 Wayback Machine returned status: ${archiveRes.status}`);
          }
        } catch (t4Err) {
          console.warn("Tier 4 Wayback Machine failed:", t4Err);
        }
      }

      // If all automated fetches were blocked or failed
      if (!fetchSuccess || !fetchedRawText) {
        return res.status(403).json({
          success: false,
          is403Blocked: true,
          error: "Serwer ogłoszenia (np. Pracuj.pl, LinkedIn) zablokował automatyczne pobieranie (403 Forbidden).",
          details: "Skopiuj tekst oferty bezpośrednio ze strony i wklej go w zakładce 'Wklej Treść Ogłoszenia'.",
        });
      }

      // Clean HTML tags, navigation, buttons, and website noise to extract pure job body
      const pureText = cleanJobHtmlToPureText(fetchedRawText);
      const truncatedText = pureText.slice(0, 15000); // Pass up to 15k chars to Gemini

      if (truncatedText.length < 50) {
        return res.status(403).json({
          success: false,
          is403Blocked: true,
          error: "Pobrano stronę, ale tekst jest zbyt krótki lub zablokowany przez zabezpieczenia serwisu.",
          details: "Wklej pełny tekst oferty ręcznie.",
        });
      }

      // Send to Gemini to parse
      const parsedJd = await parseJobDescriptionWithGemini(truncatedText);
      parsedJd.sourceUrl = url;

      // Use clean body text generated by Gemini or pureText
      const finalCleanJdText = parsedJd.cleanBodyText || pureText;

      res.json({
        success: true,
        url,
        extractedTextLength: finalCleanJdText.length,
        rawJdText: finalCleanJdText,
        parsedJd,
      });
    } catch (err: any) {
      console.error("Error fetching JD URL:", err);
      res.status(500).json({
        success: false,
        ...formatApiError("Nie udało się pobrać treści z podanego adresu URL.", err),
      });
    }
  });

  // API Route: Delta Optimization (Gemini Delta Prompting for missing keywords)
  app.post("/api/delta-optimize", async (req, res) => {
    try {
      const { missingKeywords, existingBullet, targetRole } = req.body;
      if (!existingBullet || typeof existingBullet !== "string") {
        return res.status(400).json({ error: "Brak prawidłowego punktoru (existingBullet) do optymalizacji." });
      }
      if (missingKeywords !== undefined && !Array.isArray(missingKeywords)) {
        return res.status(400).json({ error: "Pole missingKeywords musi być tablicą haseł." });
      }

      const result = await optimizeDeltaPhrases(
        missingKeywords || [],
        existingBullet,
        typeof targetRole === "string" ? targetRole : "Oprogramowanie / Specjalista"
      );

      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("Error in /api/delta-optimize:", err);
      res.status(500).json(formatApiError("Błąd podczas wywołania Delta Prompting w Gemini.", err));
    }
  });

  // API Route: AI Advisor & Educational Tutorial (Okienko Żarówki 💡)
  app.post("/api/advisor/teach", async (req, res) => {
    try {
      const { question, cvContext, jobContext } = req.body;
      if (!question || typeof question !== "string" || question.trim().length === 0) {
        return res.status(400).json({ error: "Brak pytania lub tematu do skonsultowania z Doradcą Gemini." });
      }

      const advice = await getAdvisorEducationalAdvice(
        question,
        typeof cvContext === "string" ? cvContext : JSON.stringify(cvContext || {}),
        typeof jobContext === "string" ? jobContext : JSON.stringify(jobContext || {})
      );

      res.json({ success: true, advice });
    } catch (err: any) {
      console.error("Error in /api/advisor/teach:", err);
      res.status(500).json(formatApiError("Błąd podczas generowania porady w Doradcy Gemini AI.", err));
    }
  });

  // API Route: Cover Letter Generator using Gemini Flash
  app.post("/api/generate-cover-letter", async (req, res) => {
    try {
      const { vault, targetRole, companyName, jobDescription } = req.body;

      const coverLetter = await generateCoverLetterWithFlash(
        vault || {},
        typeof targetRole === "string" ? targetRole : "Specjalista",
        typeof companyName === "string" ? companyName : "Firma",
        typeof jobDescription === "string" ? jobDescription : ""
      );

      res.json({ success: true, coverLetter });
    } catch (err: any) {
      console.error("Error in /api/generate-cover-letter:", err);
      res.status(500).json(formatApiError("Błąd podczas generowania listu motywacyjnego przez Gemini Flash.", err));
    }
  });

  if (process.env.NODE_ENV !== "production") {
    // Dynamic import keeps `vite` out of the production bundle's require graph
    // (esbuild runs with --packages=external, so a top-level import would force
    // vite to be installed on the API host for a branch that never executes).
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serves the API only — the SPA lives on Firebase Hosting.
    // Deliberately NO catch-all to index.html: that is exactly the misconfiguration
    // that made /api/* return HTML 200 on Firebase and silently break every AI call.
    app.get("/", (_req, res) => {
      res.json({ service: "SkillVault Core API", status: "ok" });
    });
    app.use((_req, res) => {
      res.status(404).json({ error: "Not found" });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SkillVault API running on port ${PORT}`);
  });
}

startServer();
