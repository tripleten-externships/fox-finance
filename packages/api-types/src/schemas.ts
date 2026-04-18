// TODO: Export your API types here
// These will be automatically generated from your Prisma schema

export type Client = any;
export type UploadLink = any;
export type DocumentRequest = any;
export type Upload = any;

export interface VerifyUploadResponse {
  token: string;
  expiresIn: number;
  uploadLinkId: string;
  clientId: string;
  clientName: string;
  requestedDocuments: Array<{
    id: string;
    documentRequestId: string;
    title: string;
    helper: string;
  }>;
  branding: {
    companyName: string | null;
  };
}
