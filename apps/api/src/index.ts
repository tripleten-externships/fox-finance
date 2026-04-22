import "dotenv/config";
import http from "http";
import { createApp } from "./app";
import "./jobs/expireUploadLinks";

async function start() {
  const app = createApp();
  const httpServer = http.createServer(app);

  const port = parseInt(process.env.PORT || "4000", 10);
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));

  console.log(`🚀 Server ready at http://localhost:${port}`);
  console.log(`📝 API endpoints available at http://localhost:${port}/api`);
}

start();
