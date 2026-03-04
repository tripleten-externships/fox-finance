import "dotenv/config";
import express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import routes from "./routes";
import healthRoutes from "./middleware/health";
import { errorHandler } from "./middleware/errorHandler";
import "./jobs/expireUploadLinks";

async function start() {
  const app = express();
  const httpServer = http.createServer(app);

  app.set("trust proxy", parseInt(process.env.TRUST_PROXY_HOPS || "1", 10));

  // Health check endpoints
  app.use("/health", healthRoutes);

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // API Routes
  app.use("/api", routes);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  const port = parseInt(process.env.PORT || "4000", 10);
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));

  console.log(`🚀 Server ready at http://localhost:${port}`);
  console.log(`📝 API endpoints available at http://localhost:${port}/api`);
}

start();
