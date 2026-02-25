import { Router } from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ScanStatus, degradeIfDatabaseUnavailable, prisma } from "@fox-finance/prisma";
import { s3Client } from "../../lib/s3";

const router = Router();

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
      }),
    );

    return res.json({
      count: threats.length,
      items: threats,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/download-url", async (req, res, next) => {
  try {
    const { id } = req.params;

    const upload = await degradeIfDatabaseUnavailable(() =>
      prisma.upload.findUnique({
        where: { id },
        select: {
          id: true,
          fileName: true,
          s3Bucket: true,
          s3Key: true,
          scanStatus: true,
          scanResult: true,
        },
      }),
    );

    if (!upload) {
      return res.status(404).json({ error: "Upload not found" });
    }

    if (upload.scanStatus === ScanStatus.PENDING || upload.scanStatus === ScanStatus.SCANNING) {
      return res.status(423).json({
        error: "File scan is still in progress",
        scanStatus: upload.scanStatus,
      });
    }

    if (upload.scanStatus === ScanStatus.THREAT_DETECTED) {
      return res.status(403).json({
        error: "Threat detected. Download blocked.",
        scanStatus: upload.scanStatus,
        details: upload.scanResult,
      });
    }

    if (upload.scanStatus === ScanStatus.FAILED) {
      return res.status(409).json({
        error: "Scan failed. Download blocked until scan succeeds.",
        scanStatus: upload.scanStatus,
        details: upload.scanResult,
      });
    }

    const command = new GetObjectCommand({
      Bucket: upload.s3Bucket,
      Key: upload.s3Key,
      ResponseContentDisposition: `attachment; filename="${upload.fileName}"`,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS,
    });

    return res.json({
      downloadUrl,
      fileName: upload.fileName,
      expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS,
      scanStatus: upload.scanStatus,
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
        select: { id: true, scanStatus: true, scanResult: true, scannedAt: true },
      }),
    );

    if (!upload) {
      return res.status(404).json({ error: "Upload not found" });
    }

    return res.json(upload);
  } catch (error) {
    next(error);
  }
});

export default router;
