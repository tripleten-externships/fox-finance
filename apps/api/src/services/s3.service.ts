import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { s3Client } from "../lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET_NAME = process.env.S3_UPLOADS_BUCKET!;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export class S3Service {
  async generatePresignedPost(params: {
    key: string;
    contentType: string;
    maxSize?: number;
  }) {
    const { key, contentType, maxSize = MAX_FILE_SIZE } = params;

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: BUCKET_NAME,
      Key: key,
      Conditions: [
        ["content-length-range", 0, maxSize],
        ["eq", "$Content-Type", contentType],
      ],
      Fields: {
        "Content-Type": contentType,
      },
      Expires: 3600, // 1 hour
    });

    return { url, fields, key };
  }

  async generatePresignedGetUrl(key: string, expiresIn: number = 3600) {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  }

  generateKey(params: {
    uploadLinkId: string;
    fileName: string;
    clientId: string;
  }): string {
    const { uploadLinkId, fileName, clientId } = params;
    const timestamp = Date.now();
    const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `uploads/${clientId}/${uploadLinkId}/${timestamp}-${sanitized}`;
  }
}

export const s3Service = new S3Service();
