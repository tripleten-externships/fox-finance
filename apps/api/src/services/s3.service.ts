import { s3Client } from "../lib/s3";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET_NAME = process.env.S3_UPLOADS_BUCKET!;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export class S3Service {
  async generatePresignedUrl(params: {
    key: string;
    contentType: string;
    contentLength: number;
    expiresIn?: number;
  }) {
    const {
      key,
      contentType,
      contentLength = MAX_FILE_SIZE,
      expiresIn = 900,
    } = params;

    const command = new PutObjectCommand({
      Key: key,
      Bucket: BUCKET_NAME,
      ContentType: contentType,
      ContentLength: contentLength,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    return { url, key };
  }

async generatePresignedGetUrl(
  key: string,
  expiresIn: number = 900,
  bucket: string = BUCKET_NAME,
) {
  const command = new GetObjectCommand({
    Bucket: bucket,
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
