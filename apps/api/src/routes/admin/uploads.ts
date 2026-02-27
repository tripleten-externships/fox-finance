import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { prisma } from '@fox-finance/prisma';
import { s3Service } from '../../services/s3.service';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../lib/s3';

const router = Router();

// Protect all routes with authentication and admin check
router.use(requireAuth, requireAdmin);

// GET /api/admin/uploads:id/download - Generate a pre-signed URL for downloading an uploaded file
router.get('/:id/download', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find the upload record to get the S3 key
        const upload = await prisma.upload.findUnique({
            where: { id},
            select: {
                id: true,
                fileName: true,
                fileSize: true,
                s3Key: true,
                s3Bucket: true,
                metadata: true,
                downloadCount: true,
                virusScanStatus: true,
            },
        });

        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        // Increment download count
        await prisma.upload.update({
            where: { id: upload.id },
            data: {
                downloadCount: { increment: 1 },
            },
        });

        // Generate a pre-signed URL for the file in S3
        const downloadUrl = `/api/admin/uploads/${upload.id}/download/file`;

        // Return data to the frontend
        res.json({
            id: upload.id,
            fileName: upload.fileName,
            fileSize: upload.fileSize,
            virusScanStatus: upload.virusScanStatus || 'pending',
            downloadCount: upload.downloadCount + 1, // Include the incremented count
            downloadUrl,
        });
    } catch (error) {
        console.error('Error generating download URL:', error);
        next(error);
    }
});

// GET /api/admin/uploads/:id/download/file - Stream the file directly (for testing or internal use)
router.get('/:id/download/file', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find the upload record to get the S3 key
        const upload = await prisma.upload.findUnique({
            where: { id },
            select: {
                fileName: true,
                s3Key: true,
                s3Bucket: true,
            },
        });

        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        // Get the file from S3
        const command = new GetObjectCommand({
            Bucket: upload.s3Bucket,
            Key: upload.s3Key,
        });

        const s3Response = await s3Client.send(command);

        // Set headers so browser treats it as a file download
        res.setHeader('Content-Disposition', `attachment; filename="${upload.fileName}"`);

        if (s3Response.ContentType) {
            res.setHeader('Content-Type', s3Response.ContentType);
        }

        if (s3Response.ContentLength) {
            res.setHeader('Content-Length', s3Response.ContentLength);
        }

         // Stream body to response
        const body = s3Response.Body;

        if (!body) {
            return res.status(500).json({ error: 'Empty S3 response body' });
        }

        // Body is a Readable stream, so we can pipe it directly to the response
        (body as NodeJS.ReadableStream).pipe(res);
    } catch (error) {
        console.error('Error streaming file from S3:', error);
        next(error);
    }});

export default router;