import { Router } from "express";
// import { prisma } from "../../lib/prisma";
// import { validate } from "../../middleware/validation";
// import { createUploadLinkSchema } from "../../schemas/uploadLink.schema";
// import { AuthenticatedRequest } from "../../middleware/auth";
import { randomBytes } from "crypto";

const router = Router();

// Generate a secure random token for upload links
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// helper function
// import { Response } from "express";
// const sendError = (
//   res: Response,
//   status: number,
//   message: string,
//   meta?: object
// ) => {
//   return res.status(status).json({
//     error: message,
//     ...(meta && { meta }), //- If meta is truthy, then evaluate to { meta: meta }.
//   });
// };
// GET /api/admin/upload-links - List all upload links
// router.get("/", async (req, res, next) => {
//   try {
//     //to fetch all upload links
//     // 1. Pagination support via query params
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 10;
//     const skip = (page - 1) * limit;

//     const uploadLinks = await prisma.uploadLink.findMany({
//       skip,
//       take: limit,
//       select: {
//         id: true,
//         createdAt: true,
//         status: true,
//         client: {
//           select: { id: true, firstName: true },
//         },
//         user: {
//           select: { id: true, email: true },
//         },
//         documentRequests: {
//           select: { id: true },
//         },
//         uploads: {
//           select: { id: true, fileName: true },
//         },
//       },
//     });

//     // 3. Return paginated response with meta info
//     const totalCount = await prisma.uploadLink.count();
//     res.json({
//       data: uploadLinks,
//       meta: {
//         page,
//         limit,
//         totalCount,
//         totalPages: Math.ceil(totalCount / limit),
//       },
//     });
//   } catch (error) {
//     // 4. Standardized error response
//     sendError(res, 500, "Failed to fetch upload links", { error });
//     next(error);
//   }
// });

// GET /api/admin/upload-links/:id - Get a specific upload link with details
// router.get("/:id", async (req, res, next) => {
//   try {
//     // TODO: Implement endpoint
//     const { id } = req.params; // UUID string
//     // - includes related client, user, documentRequests (with their uploads), and direct uploads.
//     const uploadLink = await prisma.uploadLink.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         createdAt: true,
//         status: true,
//         client: {
//           select: { id: true, firstName: true },
//         },
//         user: {
//           select: { id: true, email: true },
//         },
//         documentRequests: {
//           select: { id: true },
//         },
//         uploads: {
//           select: { id: true, fileName: true },
//         },
//       },
//     });
//     if (!uploadLink) {
//       return sendError(res, 404, "Upload link not found");
//     }
//     res.json({
//       data: uploadLink,
//       meta: {
//         requestedId: id,
//       },
//     });
//   } catch (error) {
//     sendError(res, 500, "Failed to fetch upload link", { error });
//     next(error);
//   }
// });

// POST /api/admin/upload-links - Create a new upload link

// router.post("/", validate(createUploadLinkSchema), async (req, res, next) => {
//   try {
//     const { clientId, expiresAt } = req.body;
//     const token = generateToken();

//     const authReq = req as AuthenticatedRequest;
//     // Defensive check: ensure expiresAt is valid
//     const expiryDate = new Date(expiresAt);
//     if (isNaN(expiryDate.getTime())) {
//       return sendError(res, 400, "Invalid expiration date");
//     }

//     const newUploadLink = await prisma.uploadLink.create({
//       data: {
//         clientId,
//         token,
//         expiresAt: new Date(expiresAt),
//         createdById: authReq.user.uid,
//         status: "INCOMPLETE",
//       },
//       select: {
//         id: true,
//         token: true,
//         expiresAt: true,
//         status: true,
//         client: {
//           select: { id: true, firstName: true },
//         },
//         user: {
//           select: { id: true, email: true },
//         },
//       },
//     });
//     res.status(201).json({
//       data: newUploadLink,
//       meta: {
//         createdBy: authReq.user.uid,
//       },
//     });
//   } catch (error) {
//     sendError(res, 500, "Failed to create upload link", { error });
//     next(error);
//   }
// });

// PATCH /api/admin/upload-links/:id/deactivate - Deactivate an upload link
import { Prisma } from "@prisma/client";
// router.patch("/:id/deactivate", async (req, res, next) => {
//   try {
//     // TODO: Implement endpoint
//     const { id } = req.params; // UUID string
//     const updatedLink = await prisma.uploadLink.update({
//       where: { id },
//       data: { isActive: false },
//       select: {
//         id: true,
//         isActive: true,
//         status: true,
//         client: { select: { id: true, firstName: true } },
//         user: { select: { id: true, email: true } },
//       },
//     });

//     res.json({
//       data: updatedLink,
//       meta: { deactivatedAt: new Date().toISOString(), requestedId: id },
//     });
//   } catch (error: any) {
//     if (
//       error instanceof Prisma.PrismaClientKnownRequestError &&
//       error.code === "P2025"
//     ) {
//       return sendError(res, 404, "Upload link not found", { code: error.code });
//     }
//     sendError(res, 500, "Failed to deactivate upload link", { error });
//     next(error);
//   }
// });

// PATCH /api/admin/upload-links/:id/activate - Reactivate an upload link
// router.patch("/:id/activate", async (req, res, next) => {
//   try {
//     // TODO: Implement endpoint
//     const { id } = req.params; // UUID string
//     if (!id) {
//       return sendError(res, 400, "Missing ID parameter");
//     }

//     const updatedLink = await prisma.uploadLink.update({
//       where: { id },
//       data: { isActive: true },
//       select: {
//         id: true,
//         isActive: true,
//         status: true,
//         client: {
//           select: { id: true, firstName: true }, // adjust to your schema
//         },
//         user: {
//           select: { id: true, email: true },
//         },
//       },
//     });

//     res.status(200).json({
//       data: updatedLink,
//       meta: {
//         activatedAt: new Date().toISOString(),
//         requestedId: id,
//       },
//     });
//   } catch (error: any) {
//     if (
//       error instanceof Prisma.PrismaClientKnownRequestError &&
//       error.code === "P2025"
//     ) {
//       return sendError(res, 404, "Upload link not found", { code: error.code });
//     }
//     sendError(res, 500, "Failed to activate upload link", { error });
//     next(error);
//   }
// });

// DELETE /api/admin/upload-links/:id - Delete an upload link
// router.delete("/:id", async (req, res, next) => {
//   try {
//     // TODO: Implement endpoint
//     const { id } = req.params;
//     if (!id) {
//       return sendError(res, 400, "Missing ID parameter");
//     }

//     const deletedLink = await prisma.uploadLink.delete({
//       where: { id },
//       select: {
//         id: true,
//         status: true,
//         client: { select: { id: true, firstName: true } },
//         user: { select: { id: true, email: true } },
//       },
//     });

//     res.status(200).json({
//       data: deletedLink,
//       meta: {
//         deletedAt: new Date().toISOString(),
//         requestedId: id,
//         message: "Upload link deleted successfully",
//       },
//     });
//   } catch (error: any) {
//     if (
//       error instanceof Prisma.PrismaClientKnownRequestError &&
//       error.code === "P2025"
//     ) {
//       return sendError(res, 404, "Upload link not found", { code: error.code });
//     }
//     sendError(res, 500, "Failed to delete upload link", { error });
//     next(error);
//   }
// });

export default router;
