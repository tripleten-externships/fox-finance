import express from "express";
import cors from "cors";
import routes from "./routes";
import healthRoutes from "./middleware/health";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.set("trust proxy", parseInt(process.env.TRUST_PROXY_HOPS || "1", 10));
  app.use("/health", healthRoutes);
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use("/api", routes);
  app.use(errorHandler);

  return app;
}
