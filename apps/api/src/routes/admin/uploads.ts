import { Router } from "express";
import archiver from "archiver";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { prisma, degradeIfDatabaseUnavailable } from "@fox-finance/prisma";
import { s3Client } from "../../lib/s3";
import { validate } from "../../middleware/validation";
import { bulkDownloadSchema } from "../../schemas/upload.schema";

const router = Router();

const MAX_BULK_DOWNLOAD_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_BULK_DOWNLOAD_FILES = 50;

const getSafeFileName = (fileName: string): string =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const buildArchiveName = () =>
  `fox-finance-uploads-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;

const dedupeName = (name: string, usedNames: Set<string>) => {
  const safeName = getSafeFileName(name);
  if (!usedNames.has(safeName)) {
    usedNames.add(safeName);
    return safeName;
  }

  const dotIndex = safeName.lastIndexOf(".");
  const base = dotIndex > -1 ? safeName.slice(0, dotIndex) : safeName;
  const ext = dotIndex > -1 ? safeName.slice(dotIndex) : "";

  let counter = 1;
  let candidate = `${base}-${counter}${ext}`;
  while (usedNames.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}${ext}`;
  }

  usedNames.add(candidate);
  return candidate;
};

const bodyToBuffer = async (body: unknown): Promise<Buffer | null> => {
  if (!body) return null;

  if (Buffer.isBuffer(body)) {
    return body;
  }

  const maybeBody = body as {
    transformToByteArray?: () => Promise<Uint8Array>;
  };
  if (typeof maybeBody.transformToByteArray === "function") {
    const bytes = await maybeBody.transformToByteArray();
    return Buffer.from(bytes);
  }

  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  return null;
};

// POST /api/admin/uploads/bulk-download
router.post("/bulk-download", validate(bulkDownloadSchema), async (req, res, next) => {
  try {
    const uploadIds: string[] = req.body.uploadIds;

    if (uploadIds.length > MAX_BULK_DOWNLOAD_FILES) {
      return res.status(400).json({
        error: `Cannot download more than ${MAX_BULK_DOWNLOAD_FILES} files per batch`,
      });
    }

    const uploads = await degradeIfDatabaseUnavailable(() =>
      prisma.upload.findMany({
        where: {
          id: { in: uploadIds },
        },
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          s3Key: true,
          s3Bucket: true,
        },
      }),
    );

    if (uploads.length !== uploadIds.length) {
      return res.status(404).json({
        error: "One or more selected files were not found",
      });
    }

    const totalBytes = uploads.reduce((sum, upload) => {
      const size = Number(upload.fileSize);
      return sum + (Number.isFinite(size) ? size : 0);
    }, 0);

    if (totalBytes > MAX_BULK_DOWNLOAD_BYTES) {
      return res.status(413).json({
        error: "Selected files exceed the 100MB limit",
        totalBytes,
        maxBytes: MAX_BULK_DOWNLOAD_BYTES,
      });
    }

    const archiveName = buildArchiveName();
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${archiveName}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    const usedNames = new Set<string>();

    archive.on("error", (err: Error) => {
      if (!res.headersSent) {
        next(err);
        return;
      }
      res.destroy(err);
    });

    res.on("close", () => {
      if (!res.writableEnded) {
        archive.abort();
      }
    });

    archive.pipe(res);

    for (const upload of uploads) {
      const object = await s3Client.send(
        new GetObjectCommand({
          Bucket: upload.s3Bucket,
          Key: upload.s3Key,
        }),
      );

      const fileBuffer = await bodyToBuffer(object.Body);
      if (!fileBuffer) {
        continue;
      }

      archive.append(fileBuffer, {
        name: dedupeName(upload.fileName, usedNames),
      });
    }

    await archive.finalize();
  } catch (error) {
    next(error);
  }
});

export default router;
