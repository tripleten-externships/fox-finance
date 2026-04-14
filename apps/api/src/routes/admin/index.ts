import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import clientsRouter from "./clients";
import uploadLinksRouter from "./upload-links";
import uploadsRouter from "./uploads";
import statsRouter from "./stats";
import documentTypesRouter from "./document-types";

const router = Router();

// Apply auth middleware to all admin routes
router.use(requireAuth);
router.use(requireAdmin);

router.use("/clients", clientsRouter);
router.use("/upload-links", uploadLinksRouter);
router.use("/uploads", uploadsRouter);
router.use("/stats", statsRouter);
router.use("/document-types", documentTypesRouter);

export default router;
