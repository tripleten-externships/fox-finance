import { Router } from "express";
import { prisma } from "../../lib/prisma";
import zod from "zod";

const router = Router();

// GET /api/admin/stats/trends
router.get("/trends", async (req, res, next) => {
  try {
    // 1️⃣ Validate query params
    const schema = zod.object({
      range: zod.enum(["7d", "30d", "90d", "1y"]).default("30d"),
    });
    const { range } = schema.parse(req.query);

    const now = new Date();
    const startDate = new Date();
    const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
    startDate.setDate(now.getDate() - daysMap[range]);

    // 2️⃣ Uploads over time (line chart)
    const uploadsOverTime = await prisma.$queryRaw<
      { day: string; count: number }[]
    >`
      SELECT DATE("uploadedAt") as day, COUNT(*) as count
      FROM "Upload"
      WHERE "uploadedAt" >= ${startDate}
      GROUP BY day
      ORDER BY day ASC;
    `;

    // 3️⃣ Uploads by client (bar chart) using join with UploadLink
    const uploadsByClient = await prisma.$queryRaw<
      { clientId: string; count: number }[]
    >`
      SELECT ul."clientId", COUNT(*) as count
      FROM "Upload" u
      JOIN "UploadLink" ul ON u."uploadLinkId" = ul."id"
      WHERE u."uploadedAt" >= ${startDate}
      GROUP BY ul."clientId"
      ORDER BY count DESC;
    `;

    // 4️⃣ File types (pie chart) from metadata JSON
    const fileTypes = await prisma.$queryRaw<
      { fileType: string; count: number }[]
    >`
      SELECT metadata->>'fileType' as "fileType", COUNT(*) as count
      FROM "Upload"
      WHERE "uploadedAt" >= ${startDate}
      GROUP BY metadata->>'fileType'
      ORDER BY count DESC;
    `;

    res.status(200).json({
      message: "Trend data retrieved successfully",
      uploadsOverTime,
      uploadsByClient,
      fileTypes,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
