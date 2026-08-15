import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { jobsRouter } from "./src/server/routes/jobs.routes";
import { cvRouter } from "./src/server/routes/cv.routes";
import { aiRouter } from "./src/server/routes/ai.routes";
import { statsRouter } from "./src/server/routes/stats.routes";
import { errorHandler } from "./src/server/middleware/errorHandler";
import { standardApiLimiter } from "./src/server/middleware/rateLimiter";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // CORS & Security Headers
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("X-Content-Type-Options", "nosniff");
    res.header("X-Frame-Options", "DENY");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Body parser with 10MB limit for rich CV text/diffs
  app.use(express.json({ limit: "10mb" }));

  // API Rate Limiting for all incoming /api requests
  app.use("/api", standardApiLimiter);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "CVELOCITY Core Engine API",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Mount Modular Routes
  app.use("/api", jobsRouter);
  app.use("/api", cvRouter);
  app.use("/api", aiRouter);
  app.use("/api", statsRouter);

  // Global Error Handler Middleware
  app.use(errorHandler);

  // Vite Dev Server / Static Production Bundle
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
    console.log(`CVELOCITY Engine Server running on http://localhost:${PORT}`);
  });
}

startServer();
