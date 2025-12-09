import { UploadLink, Client } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      uploadLink?: UploadLink;
      client?: Client;
    }
  }
}

export {};
