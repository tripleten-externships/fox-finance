import { Router } from "express";
import adminRoutes from "./admin";
import uploadRoutes from "./upload";

const router = Router();

router.use("/admin", adminRoutes);
router.use("/upload", uploadRoutes);

export default router;
