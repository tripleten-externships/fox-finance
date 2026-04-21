import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import {
  ScanStatus,
  degradeIfDatabaseUnavailable,
  prisma,
} from "@fox-finance/prisma";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../lib/s3";

const router = Router();

router.use(requireAuth, requireAdmin);

const DOWNLOAD_URL_EXPIRY_SECONDS = 900;

router.get("/threats", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const threats = await degradeIfDatabaseUnavailable(() =>
      prisma.upload.findMany({
        where: { scanStatus: ScanStatus.THREAT_DETECTED },
        orderBy: { scannedAt: "desc" },
        take: limit,
        select: {
          id: true,
          fileName: true,
          scanStatus: true,
          scanResult: true,
          scannedAt: true,
          uploadLinkId: true,
          uploadLink: {
            select: {
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      })
    );

    return res.json({
      count: threats.length,
      items: threats,
    });
  } catch (error) {
    next(error);
  }
});


router.get("/:id/scan-status", async (req, res, next) => {
  try {
    const { id } = req.params;

    const upload = await degradeIfDatabaseUnavailable(() =>
      prisma.upload.findUnique({
        where: { id },
        select: {
          id: true,
          scanStatus: true,
          scanResult: true,
          scannedAt: true,
        },
      })
    );

    if (!upload) {
      return res.status(404).json({ error: "Upload not found" });
    }

    return res.json(upload);
  } catch (error) {
    next(error);
  }
});


router.get("/:id/download", async (req, res, next) => {
  try {
    const { id } = req.params;

    const upload = await prisma.upload.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        s3Key: true,
        s3Bucket: true,
        downloadCount: true,
        scanStatus: true,
      },
    });

    if (!upload) {
      return res.status(404).json({ error: "Upload not found" });
    }

    // Block unsafe downloads
    if (
      upload.scanStatus === ScanStatus.PENDING ||
      upload.scanStatus === ScanStatus.SCANNING
    ) {
      return res.status(423).json({
        error: "File scan in progress",
        scanStatus: upload.scanStatus,
      });
    }

    if (upload.scanStatus === ScanStatus.THREAT_DETECTED) {
      return res.status(403).json({
        error: "Threat detected. Download blocked.",
        scanStatus: upload.scanStatus,
      });
    }

    if (upload.scanStatus === ScanStatus.FAILED) {
      return res.status(409).json({
        error: "Scan failed. Download blocked.",
        scanStatus: upload.scanStatus,
      });
    }

    // increment download count
    await prisma.upload.update({
      where: { id: upload.id },
      data: {
        downloadCount: { increment: 1 },
      },
    });

    const downloadUrl = `/api/admin/uploads/${upload.id}/download/file`;

    return res.json({
      id: upload.id,
      fileName: upload.fileName,
      fileSize: upload.fileSize,
      virusScanStatus: upload.scanStatus,
      downloadCount: upload.downloadCount + 1,
      downloadUrl,
    });
  } catch (error) {
    next(error);
  }
});


router.get("/:id/download/file", async (req, res, next) => {
  try {
    const { id } = req.params;

    const upload = await prisma.upload.findUnique({
      where: { id },
      select: {
        fileName: true,
        s3Key: true,
        s3Bucket: true,
      },
    });

    if (!upload) {
      return res.status(404).json({ error: "Upload not found" });
    }

    const command = new GetObjectCommand({
      Bucket: upload.s3Bucket,
      Key: upload.s3Key,
    });

    const s3Response = await s3Client.send(command);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${upload.fileName}"`
    );

    if (s3Response.ContentType) {
      res.setHeader("Content-Type", s3Response.ContentType);
    }

    if (s3Response.ContentLength) {
      res.setHeader("Content-Length", s3Response.ContentLength);
    }

    const body = s3Response.Body;

    if (!body) {
      return res.status(500).json({ error: "Empty S3 response body" });
    }

    (body as NodeJS.ReadableStream).pipe(res);
  } catch (error) {
    next(error);
  }
});

export default router;
