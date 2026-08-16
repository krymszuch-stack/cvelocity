// Must run before anything reads process.env. `dotenv` was a declared dependency
// but was never imported, so .env files were silently ignored — which also left
// NODE_ENV unset and put the error handler into its most verbose mode.
import "dotenv/config";

import express from "express";
import path from "path";
import { fileURLToPath } from "node:url";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import { jobsRouter } from "./src/server/routes/jobs.routes";
import { cvRouter } from "./src/server/routes/cv.routes";
import { aiRouter } from "./src/server/routes/ai.routes";
import { statsRouter } from "./src/server/routes/stats.routes";
import { errorHandler } from "./src/server/middleware/errorHandler";
import { standardApiLimiter } from "./src/server/middleware/rateLimiter";
import { loadConfig } from "./src/server/config";

async function startServer() {
  // Throws and stops the process if required configuration is missing.
  const config = loadConfig();
  const isProduction = config.NODE_ENV === "production";

  const app = express();
  app.disable("x-powered-by");

  // Only meaningful behind a reverse proxy. Enabling it without one would let a
  // client spoof its address through X-Forwarded-For and bypass rate limiting.
  if (config.TRUST_PROXY) {
    app.set("trust proxy", 1);
  }

  // The whole threat model here is "XSS reads localStorage", which makes CSP the
  // single most valuable header. Dev needs the loose directives Vite's HMR
  // requires; production gets the strict set.
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              // Tailwind injects styles at runtime.
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "blob:"],
              fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
              connectSrc: ["'self'", "https://*.supabase.co", "https://api.stripe.com"],
              frameAncestors: ["'none'"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
      // helmet defaults to SAMEORIGIN; this app is never meant to be framed.
      frameguard: { action: "deny" },
      hsts: isProduction ? { maxAge: 31_536_000, includeSubDomains: true } : false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    })
  );

  // Reflect only origins on the allowlist — never a wildcard. `Vary: Origin`
  // keeps caches from serving one origin's response to another.
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.header("Vary", "Origin");

    if (origin && config.allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    }

    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // 200kB globally. The previous 10MB limit combined with 120 req/min allowed
  // 1.2GB/min of JSON per IP. Routes that genuinely need large bodies raise it
  // for themselves.
  app.use(express.json({ limit: "200kb" }));

  app.use("/api", standardApiLimiter);

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "CVELOCITY Core Engine API",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // CV documents can legitimately be large; this is the one route that needs it.
  app.use("/api/parse-cv", express.json({ limit: "2mb" }));

  app.use("/api", jobsRouter);
  app.use("/api", cvRouter);
  app.use("/api", aiRouter);
  app.use("/api", statsRouter);

  app.use(errorHandler);

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Resolve relative to this file rather than the working directory, so the
    // server does not depend on where it was launched from.
    const distPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(config.PORT, "0.0.0.0", () => {
    console.log(`CVELOCITY Engine Server running on http://localhost:${config.PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Nie udało się uruchomić serwera:\n", err instanceof Error ? err.message : err);
  process.exit(1);
});
