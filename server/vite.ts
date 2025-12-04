import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger, loadConfigFromFile } from "vite";
import { type Server } from "http";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
  const clientRoot = path.resolve(process.cwd(), "client");

  // 🔥 Load actual vite.config.ts
 const configLoaded = await loadConfigFromFile(
  { command: "serve", mode: "development" },
  path.resolve(process.cwd(), "vite.config.ts")
);

if (!configLoaded) {
  throw new Error("Failed to load Vite config file (vite.config.ts)");
}


  const vite = await createViteServer({
    ...configLoaded.config, // <-- Apply full Vite config (plugins included)
    root: clientRoot,       // <-- Override root cleanly
    configFile: false,      // <-- Prevent reloading file again
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
    resolve: {
      alias: {
        "@": path.resolve(clientRoot, "src"),
        "src": path.resolve(clientRoot, "src"),
        "@shared": path.resolve(process.cwd(), "shared"),
        "@assets": path.resolve(process.cwd(), "attached_assets"),
      },
    },
  });

  // Attach Vite middleware
  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;

      const templatePath = path.resolve(clientRoot, "index.html");
      let template = await fs.promises.readFile(templatePath, "utf-8");

      // Avoid caching of main.tsx
      template = template.replace(
        /\/src\/main\.tsx/g,
        `/src/main.tsx?v=${nanoid()}`
      );

      const transformed = await vite.transformIndexHtml(url, template);

      res.status(200).set({ "Content-Type": "text/html" }).end(transformed);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find build directory: ${distPath}`);
  }

  // 🔥 Fix: Clerk SSO callback must load React index.html
  app.get(
    [
      "/sign-in/*",
      "/sign-up/*",
      "/sign-in/sso-callback",
      "/sign-up/sso-callback",
      "/sso-callback"
    ],
    (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    }
  );

  // Serve static files
  app.use(express.static(distPath));

  // Default SPA fallback (React router)
  app.use("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

