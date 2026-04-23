import express from "express";
import dotenv from "dotenv";
import path from "path";

import jobRoutes from "./server/routes/jobRoutes.js";
import proxyRoutes from "./server/routes/proxyRoutes.js";
import authRoutes from "./server/routes/authRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

if (!process.env.HUBSPOT_TOKEN) {
  console.warn("⚠️ HUBSPOT_TOKEN er ikke satt i miljøvariabler. Appen vil kjøre med mock-data.");
}

// API Routes
app.use("/api/photo", jobRoutes);
app.use("/api", proxyRoutes);
app.use("/api/auth", authRoutes);

export default app;

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  async function startServer() {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static("dist"));
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server kjører på http://localhost:${PORT}`);
    });
  }

  startServer();
}
