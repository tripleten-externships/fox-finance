import request from "supertest";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@fox-finance/prisma";
import uploadRouter from "../../routes/upload";
import { createTestApp } from "../../test/utils/createTestApp";
import { s3Client } from "../../lib/s3";

const app = createTestApp(uploadRouter, { basePath: "/api/upload" });
const getBucket = () => process.env.S3_UPLOADS_BUCKET as string;
const getSecret = () => process.env.UPLOAD_TOKEN_SECRET as string;

const MAX_FILE_SIZE = 50 * 1024 * 1024;

type Fixture = {
  userId: string;
  clientId: string;
  uploadLinkId: string;
  authToken: string;
  documentRequestId: string;
  documentTypeId: string;
  requestedDocumentId: string;
};

const putToS3 = async (url: string, body: Buffer, contentType: string) => {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": body.length.toString(),
    },
    body,
  });

  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
};

const createFixture = async (): Promise<Fixture> => {
  const suffix = crypto.randomUUID();
  const userId = `admin-${suffix}`;
  const clientId = crypto.randomUUID();
  const uploadLinkId = crypto.randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      email: `admin-${suffix}@test.local`,
      name: "Test Admin",
      role: "ADMIN",
    },
  });

  await prisma.client.create({
    data: {
      id: clientId,
      email: `client-${suffix}@test.local`,
      firstName: "Test",
      lastName: "Client",
      phone: "555-000-1234",
      status: "ACTIVE",
    },
  });

  const authToken = jwt.sign(
    {
      uploadLinkId,
      clientId,
      type: "auth",
    },
    getSecret(),
  );

  await prisma.uploadLink.create({
    data: {
      id: uploadLinkId,
      clientId,
      token: authToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      isActive: true,
      createdById: userId,
    },
  });

  const documentRequest = await prisma.documentRequest.create({
    data: {
      uploadLinkId,
      instructions: "Please upload test documents.",
    },
  });

  const documentType = await prisma.documentType.create({
    data: {
      name: `Test Document ${suffix}`,
      description: "Test document type",
    },
  });

  const requestedDocument = await prisma.requestedDocument.create({
    data: {
      documentTypeId: documentType.id,
      description: "Test document description",
      documentRequestId: documentRequest.id,
    },
  });

  return {
    userId,
    clientId,
    uploadLinkId,
    authToken,
    documentRequestId: documentRequest.id,
    documentTypeId: documentType.id,
    requestedDocumentId: requestedDocument.id,
  };
};

const cleanupFixture = async (fixture: Fixture, s3Keys: string[]) => {
  await Promise.all(
    s3Keys.map((key) =>
      s3Client
        .send(
          new DeleteObjectCommand({
            Bucket: getBucket(),
            Key: key,
          }),
        )
        .catch(() => undefined),
    ),
  );

  await prisma.upload.deleteMany({
    where: { uploadLinkId: fixture.uploadLinkId },
  });

  await prisma.requestedDocument.deleteMany({
    where: { documentRequestId: fixture.documentRequestId },
  });

  await prisma.documentRequest.deleteMany({
    where: { uploadLinkId: fixture.uploadLinkId },
  });

  await prisma.uploadLink.deleteMany({
    where: { id: fixture.uploadLinkId },
  });

  await prisma.client.deleteMany({ where: { id: fixture.clientId } });
  await prisma.user.deleteMany({ where: { id: fixture.userId } });
  await prisma.documentType.deleteMany({ where: { id: fixture.documentTypeId } });
};

describe("Upload flow integration", () => {
  let fixture: Fixture;
  let s3Keys: string[];

  beforeEach(async () => {
    fixture = await createFixture();
    s3Keys = [];
  });

  afterEach(async () => {
    await cleanupFixture(fixture, s3Keys);
  });

  it("completes upload flow and creates the upload record", async () => {
    const verifyRes = await request(app)
      .get("/api/upload/verify")
      .query({ token: fixture.authToken });

    expect(verifyRes.status).toBe(200);
    const bearer = verifyRes.body.token as string;

    const file = Buffer.from("hello test");
    const presignedRes = await request(app)
      .post("/api/upload/presigned-url")
      .set("Authorization", `Bearer ${bearer}`)
      .send({
        files: [
          {
            fileName: "clean.pdf",
            contentType: "application/pdf",
            contentLength: file.length,
          },
        ],
      });

    expect(presignedRes.status).toBe(200);
    const { presignedUrl, s3Key } = presignedRes.body as {
      presignedUrl: string;
      s3Key: string;
    };

    s3Keys.push(s3Key);

    const putRes = await putToS3(presignedUrl, file, "application/pdf");
    expect(putRes.ok).toBe(true);

    const completeRes = await request(app)
      .post("/api/upload/complete")
      .set("Authorization", `Bearer ${bearer}`)
      .send({
        s3Key,
        fileName: "clean.pdf",
        fileSize: file.length,
        fileType: "application/pdf",
        documentRequestId: fixture.documentRequestId,
      });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.upload?.id).toBeTruthy();

    const uploadRecord = await prisma.upload.findUnique({
      where: { id: completeRes.body.upload.id },
    });
    expect(uploadRecord).not.toBeNull();

    await s3Client.send(
      new HeadObjectCommand({
        Bucket: getBucket(),
        Key: s3Key,
      }),
    );
  });

  it("rejects unsupported file types", async () => {
    const verifyRes = await request(app)
      .get("/api/upload/verify")
      .query({ token: fixture.authToken });
    const bearer = verifyRes.body.token as string;

    const presignedRes = await request(app)
      .post("/api/upload/presigned-url")
      .set("Authorization", `Bearer ${bearer}`)
      .send({
        files: [
          {
            fileName: "bad.txt",
            contentType: "text/plain",
            contentLength: 10,
          },
        ],
      });

    expect(presignedRes.status).toBe(400);
  });

  it("rejects files that exceed size limits", async () => {
    const verifyRes = await request(app)
      .get("/api/upload/verify")
      .query({ token: fixture.authToken });
    const bearer = verifyRes.body.token as string;

    const presignedRes = await request(app)
      .post("/api/upload/presigned-url")
      .set("Authorization", `Bearer ${bearer}`)
      .send({
        files: [
          {
            fileName: "big.pdf",
            contentType: "application/pdf",
            contentLength: MAX_FILE_SIZE + 1,
          },
        ],
      });

    expect(presignedRes.status).toBe(400);
  });

  it("rejects invalid auth tokens", async () => {
    const verifyRes = await request(app)
      .get("/api/upload/verify")
      .query({ token: "not-a-valid-token" });

    expect(verifyRes.status).toBe(401);
  });

  it("returns 400 when the S3 object is missing", async () => {
    const verifyRes = await request(app)
      .get("/api/upload/verify")
      .query({ token: fixture.authToken });
    const bearer = verifyRes.body.token as string;

    const completeRes = await request(app)
      .post("/api/upload/complete")
      .set("Authorization", `Bearer ${bearer}`)
      .send({
        s3Key: `uploads/${fixture.clientId}/${fixture.uploadLinkId}/missing.pdf`,
        fileName: "missing.pdf",
        fileSize: 10,
        fileType: "application/pdf",
        documentRequestId: fixture.documentRequestId,
      });

    expect(completeRes.status).toBe(400);
  });

  it("supports concurrent uploads", async () => {
    const verifyRes = await request(app)
      .get("/api/upload/verify")
      .query({ token: fixture.authToken });
    const bearer = verifyRes.body.token as string;

    const files = [
      Buffer.from("file-one"),
      Buffer.from("file-two"),
    ];

    const presignedRes = await request(app)
      .post("/api/upload/presigned-url")
      .set("Authorization", `Bearer ${bearer}`)
      .send({
        files: [
          {
            fileName: "file-one.pdf",
            contentType: "application/pdf",
            contentLength: files[0].length,
          },
          {
            fileName: "file-two.pdf",
            contentType: "application/pdf",
            contentLength: files[1].length,
          },
        ],
      });

    expect(presignedRes.status).toBe(200);
    const { uploads } = presignedRes.body as {
      uploads: { presignedUrl: string; s3Key: string }[];
    };

    s3Keys.push(...uploads.map((upload) => upload.s3Key));

    const putResults = await Promise.all(
      uploads.map((upload, index) =>
        putToS3(upload.presignedUrl, files[index], "application/pdf"),
      ),
    );
    putResults.forEach((result) => expect(result.ok).toBe(true));

    const completeResults = await Promise.all(
      uploads.map((upload, index) =>
        request(app)
          .post("/api/upload/complete")
          .set("Authorization", `Bearer ${bearer}`)
          .send({
            s3Key: upload.s3Key,
            fileName: index === 0 ? "file-one.pdf" : "file-two.pdf",
            fileSize: files[index].length,
            fileType: "application/pdf",
            documentRequestId: fixture.documentRequestId,
          }),
      ),
    );

    completeResults.forEach((result) => expect(result.status).toBe(200));

    const uploadsInDb = await prisma.upload.findMany({
      where: { uploadLinkId: fixture.uploadLinkId },
    });
    expect(uploadsInDb.length).toBeGreaterThanOrEqual(2);
  });
});
