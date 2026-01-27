import { Router } from "express";
import { prisma, degradeIfDatabaseUnavailable } from "@fox-finance/prisma";

const router = Router();

// GET /api/admin/document-types - Fetch all document types
router.get("/", async (req, res, next) => {
  try {
    const documentTypes = await degradeIfDatabaseUnavailable(() =>
      prisma.documentType.findMany({
        orderBy: { name: "asc" },
      }),
    );

    res.status(200).json(documentTypes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch document types" });
    next(error);
  }
});

export default router;
