import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "SkillVault Core API", timestamp: new Date().toISOString() });
  });

  // ==========================================
  // OAUTH 2.0 ENDPOINTS (ENVIRONMENT PREPARED)
  // ==========================================

  // API Route: Google OAuth Login/Callback
  app.post("/api/auth/google", (req, res) => {
    // Tutaj weryfikujemy Google ID Token przesłany z frontendu
    // np. przy użyciu biblioteki google-auth-library (OAuth2Client)
    res.status(501).json({ 
      success: false, 
      message: "Google OAuth API przygotowane. Wymaga podpięcia Google Client ID i weryfikacji tokenu." 
    });
  });

  // API Route: Azure Entra ID (Microsoft) OAuth Login/Callback
  app.post("/api/auth/azure", (req, res) => {
    // Tutaj weryfikujemy token z Azure Entra ID 
    // np. używając @azure/msal-node
    res.status(501).json({ 
      success: false, 
      message: "Azure Entra ID API przygotowane. Wymaga podpięcia Tenant ID i Client ID." 
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
      res.status(500).json({
        error: "Nie udało się sparsować dokumentu przez API Gemini.",
        details: err?.message || String(err),
      });
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
      res.status(500).json({
        error: "Nie udało się sparsować ogłoszenia o pracę.",
        details: err?.message || String(err),
      });
    }
  });

  // API Route: Fetch and Parse Job Offer URL
  app.post("/api/fetch-jd-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string" || !url.startsWith("http")) {
        return res.status(400).json({ error: "Podaj prawidłowy adres URL ogłoszenia o pracę (http/https)." });
      }

      console.log(`Fetching job offer URL: ${url}`);

      let fetchedRawText = "";
      let fetchSuccess = false;

      // Tier 1: Direct fetch with browser headers
      try {
        const response = await fetch(url, {
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
        error: "Nie udało się pobrać treści z podanego adresu URL.",
        details: err?.message || String(err),
      });
    }
  });

  // API Route: Delta Optimization (Gemini Delta Prompting for missing keywords)
  app.post("/api/delta-optimize", async (req, res) => {
    try {
      const { missingKeywords, existingBullet, targetRole } = req.body;
      if (!existingBullet) {
        return res.status(400).json({ error: "Brak punktora do optymalizacji." });
      }

      const result = await optimizeDeltaPhrases(
        missingKeywords || [],
        existingBullet,
        targetRole || "Oprogramowanie / Specjalista"
      );

      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("Error in /api/delta-optimize:", err);
      res.status(500).json({
        error: "Błąd podczas wywołania Delta Prompting w Gemini.",
        details: err?.message || String(err),
      });
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
      res.status(500).json({
        error: "Błąd podczas generowania porady w Doradcy Gemini AI.",
        details: err?.message || String(err),
      });
    }
  });

  // API Route: Cover Letter Generator using Gemini Flash
  app.post("/api/generate-cover-letter", async (req, res) => {
    try {
      const { vault, targetRole, companyName, jobDescription } = req.body;

      const coverLetter = await generateCoverLetterWithFlash(
        vault || {},
        targetRole || "Specjalista",
        companyName || "Firma",
        jobDescription || ""
      );

      res.json({ success: true, coverLetter });
    } catch (err: any) {
      console.error("Error in /api/generate-cover-letter:", err);
      res.status(500).json({
        error: "Błąd podczas generowania listu motywacyjnego przez Gemini Flash.",
        details: err?.message || String(err),
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SkillVault Server running on http://localhost:${PORT} (http://127.0.0.1:${PORT})`);
  });
}

startServer();
