import app from "./src/server/app";
import { createServer as createViteServer } from "vite";
import { initAndMigrateDatabase } from "./src/db/migrate";
import path from "path";
import express from "express";

async function startServer() {
  // Ensure the PostgreSQL schema and seeds are initialized before serving requests
  try {
    await initAndMigrateDatabase();
  } catch (err: any) {
    console.warn("Database initialization warning:", err.message || err);
  }

  const PORT = Number(process.env.PORT) || 3000;

  // Serve static files in production / Vite development middleware in dev
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
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
