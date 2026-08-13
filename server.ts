// Must precede the gemini import so GEMINI_API_KEY from .env is visible to it.
// On Render this is a no-op — dotenv never overrides variables already in the process.
import "dotenv/config";
import express from "express";
import * as cheerio from "cheerio";
import { parseRawCvToVault, optimizeDeltaPhrases, parseJobDescriptionWithGemini, getAdvisorEducationalAdvice, generateCoverLetterWithFlash, generateInterviewCheatSheetEnrichmentWithFlash, getGeminiUsageStats } from "./src/server/gemini";
import { OutboundValidationError, validateOutboundUrl, validateOutboundHost, safeOutboundFetch } from "./src/lib/outboundValidation";

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

  const normalized = htmlOrText.replace(/\u00a0/g, " ").replace(/\r/g, "");

  try {
    const $ = cheerio.load(normalized);

    const candidates: string[] = [];

    $("script[type='application/ld+json']").each((_, el) => {
      try {
        const rawJson = $(el).contents().text();
        const parsed = JSON.parse(rawJson);
        const jobPosting = Array.isArray(parsed)
          ? parsed.find((item: any) => item && (item['@type'] === 'JobPosting' || item.type === 'JobPosting'))
          : parsed && (parsed['@type'] === 'JobPosting' || parsed.type === 'JobPosting')
            ? parsed
            : null;

        if (jobPosting && jobPosting.description) {
          const cleanDesc = cheerio.load(jobPosting.description).text();
          const title = jobPosting.title || '';
          const org = jobPosting.hiringOrganization?.name || jobPosting.company?.name || '';
          candidates.push(`Stanowisko: ${title}\nFirma: ${org}\n\nOpis Oferty i Wymagania:\n${cleanDesc}`);
        }
      } catch {
        // Skip invalid JSON-LD
      }
    });

    $("meta[name='description'], meta[property='og:description'], meta[name='twitter:description']").each((_, el) => {
      const content = $(el).attr('content');
      if (content && content.trim().length > 40) { candidates.push(content.trim()); }
    });

    const prioritizedSelectors = [
      "main article",
      "article",
      "main",
      "[role='main']",
      ".job-offer",
      ".job-offer__content",
      ".offer-details",
      ".job-description",
      "#job-description",
      ".description",
      ".offer-content",
      ".job-details",
      ".offer-body",
      "[data-testid*='job' i]",
      "[data-test*='offer' i]",
      ".listing-content",
      ".content-wrapper",
    ];

    for (const selector of prioritizedSelectors) {
      const text = $(selector).first().text();
      if (text && text.trim().length > 200) {
        candidates.push(text);
        break;
      }
    }

    // Strip non-content elements — use tag names and ARIA roles only.
    $(
      "script, style, svg, noscript, iframe, canvas, header, footer, nav, aside, form, button, input, select, textarea, [role='navigation'], [role='banner'], [role='contentinfo'], [role='dialog'], [aria-label*='cookie' i], [class*='cookie' i], [id*='cookie' i]"
    ).remove();

    const bodyText = $("body").text() || $.text();
    if (bodyText && bodyText.trim().length > 50) candidates.push(bodyText);

    const bestText = candidates
      .map((candidate) => candidate.replace(/\s+/g, " ").trim())
      .filter((candidate) => candidate.length > 80)
      .sort((a, b) => b.length - a.length)[0];

    if (bestText) {
      return filterTextNoiseLines(bestText);
    }

    return filterTextNoiseLines((bodyText || normalized).replace(/<[^>]+>/g, " "));
  } catch {
    const simple = normalized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return filterTextNoiseLines(simple);
  }
}

async function scrapeJobPageText(url: string): Promise<{ text: string; source: string }> {
  const targetHost = url.replace(/^https?:\/\//i, "");
  const proxyCandidates = [
    { label: "direct", url },
    { label: "jina", url: `https://r.jina.ai/http://${targetHost}` },
    { label: "allorigins", url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
  ];

  for (const candidate of proxyCandidates) {
    try {
      const response = await safeOutboundFetch(candidate.url, {
        signal: AbortSignal.timeout(OUTBOUND_TIMEOUT_MS),
        headers: {
          Accept: "text/html, text/plain, application/xhtml+xml, */*;q=0.8",
          "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) continue;

      const text = await response.text();
      const cleaned = cleanJobHtmlToPureText(text);
      if (cleaned && cleaned.length > 120) {
        return { text: cleaned, source: candidate.label };
      }
    } catch (err) {
      if (err instanceof OutboundValidationError) {
        throw err;
      }
      // Try the next source for standard fetch failures
    }
  }

  return { text: "", source: "none" };
}

/** Origins allowed to call this API from a browser. Overridable via ALLOWED_ORIGINS (comma-separated). */
const DEFAULT_ALLOWED_ORIGINS = [
  "https://cvelocity-99a72.web.app",
  "https://cvelocity-99a72.firebaseapp.com",
  "https://cvelocity.oathcry.com",
  "https://cv.oathcry.com",
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
const OUTBOUND_TIMEOUT_MS = 8000;

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
      service: "CVELOCITY Core API",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/usage/stats", (_req, res) => {
    const stats = getGeminiUsageStats();
    res.json({
      success: true,
      stats: {
        providerName: stats.providerName,
        apiPromptTokens: stats.promptTokens,
        apiOutputTokens: stats.outputTokens,
        apiTotalTokens: stats.totalTokens,
        geminiDeltaCalls: stats.requestCount,
        apiCostUSD: stats.totalCostUSD,
        lastSyncedAt: stats.lastSyncedAt,
      },
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
      let fetchSource = "";

      const scrapeResult = await scrapeJobPageText(url);
      fetchedRawText = scrapeResult.text;
      fetchSource = scrapeResult.source;
      fetchSuccess = !!fetchedRawText && fetchedRawText.length > 120;

      if (!fetchSuccess) {
        console.warn(`All job-board fetch strategies failed for ${url}`);
      } else {
        console.log(`Scraper succeeded via ${fetchSource} for ${url}`);
      }

      if (!fetchSuccess || !fetchedRawText) {
        return res.status(403).json({
          success: false,
          is403Blocked: true,
          error: "Serwer ogłoszenia zablokował automatyczne pobieranie lub strona nie zawiera czytelnej treści oferty.",
          details: "Skopiuj tekst oferty bezpośrednio ze strony i wklej go w zakładce 'Wklej Treść Ogłoszenia'.",
        });
      }

      const pureText = fetchedRawText;
      const truncatedText = pureText.slice(0, 15000);

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
      if (err instanceof OutboundValidationError) {
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }
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

  // API Route: Interview Cheat Sheet Enrichment (STAR points, framing, emergency phrases)
  app.post("/api/generate-cheat-sheet", async (req, res) => {
    try {
      const { vault, targetRole, companyName, jobDescription, topRequirements } = req.body;

      const enrichment = await generateInterviewCheatSheetEnrichmentWithFlash(
        vault || {},
        targetRole || "Specjalista",
        companyName || "Firma",
        jobDescription || "",
        Array.isArray(topRequirements) ? topRequirements : []
      );

      res.json({ success: true, enrichment });
    } catch (err: any) {
      console.error("Error in /api/generate-cheat-sheet:", err);
      res.status(500).json({
        error: "Błąd podczas generowania ściągi na rozmowę przez Gemini Flash.",
        details: err?.message || String(err),
      });
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
      res.json({ service: "CVELOCITY Core API", status: "ok" });
    });
    app.use((_req, res) => {
      res.status(404).json({ error: "Not found" });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CVELOCITY API running on port ${PORT}`);
  });
}

startServer();
