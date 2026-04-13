import express, { Router } from "express";
import { errorHandler } from "../../middleware/errorHandler";

export const createTestApp = (
  router: Router,
  options?: {
    basePath?: string;
    user?: { uid: string; role: string; email?: string };
  },
) => {
  const app = express();
  app.use(express.json());

  if (options?.user) {
    app.use((req, _res, next) => {
      (req as any).user = options.user;
      next();
    });
  }

  app.use(options?.basePath || "/", router);
  app.use(errorHandler);

  return app;
};
