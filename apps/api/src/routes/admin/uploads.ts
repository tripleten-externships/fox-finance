import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { prisma } from '@fox-finance/prisma';
import { s3Service } from 'src/services/s3.service';

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

        // Generate a pre-signed URL (valid for 1 hour)
        const downloadUrl = await s3Service.generatePresignedGetUrl(
            upload.s3Key,
            3600,
            upload.s3Bucket
        );

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

export default router;