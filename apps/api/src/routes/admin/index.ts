import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import clientsRouter from "./clients";
import uploadLinksRouter from "./upload-links";
import uploadRouter from "./uploads";

const router = Router();

// Apply auth middleware to all admin routes
//router.use(requireAuth);
//router.use(requireAdmin);

router.use("/clients", clientsRouter);
router.use("/upload-links", uploadLinksRouter);
router.use("/uploads", uploadRouter);

export default router;
