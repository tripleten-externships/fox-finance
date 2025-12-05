import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validation";
import {
  createClientSchema,
  updateClientSchema,
} from "../../schemas/client.schema";
import { Prisma, UploadStatus, Status } from "@prisma/client";

const router = Router();
//helper function
import { Response } from "express";

const sendError = (
  res: Response,
  status: number,
  message: string,
  meta?: object
) => {
  return res.status(status).json({
    error: message,
    ...(meta && { meta }),
  });
};

// GET /api/admin/clients - List all clients
router.get("/stats", async (req, res, next) => {
  const startTime = Date.now(); // track response time

  try {
    // TODO: Implement endpoint
    // Run queries in parallel

    const [
      totalClients,
      activeClients,
      totalUploadLinks,
      activeUploadLinks,
      completedUploadLinks,
      pendingFileUploads,
      uploadsByClient,
    ] = await Promise.all([
      // Total clients
      prisma.client.count(),

      // Active clients
      prisma.client.count({ where: { status: Status.ACTIVE } }),

      // Total upload links
      prisma.uploadLink.count(),

      // Active upload links (still incomplete)
      prisma.uploadLink.count({ where: { status: UploadStatus.INCOMPLETE } }),

      // Completed upload links
      prisma.uploadLink.count({ where: { status: UploadStatus.COMPLETE } }),
      // Pending file uploads (requests not yet complete)
      prisma.documentRequest.count({
        where: { status: UploadStatus.INCOMPLETE },
      }),

      // Group uploads by client
      prisma.upload.groupBy({
        by: ["uploadLinkId"],
        _count: { id: true },
      }),
    ]);

    const responseTime = Date.now() - startTime;

    res.json({
      data: {
        totalClients,
        activeClients,
        uploadMetrics: {
          totalUploadLinks,
          activeUploadLinks,
          completedUploadLinks,
          pendingFileUploads,
          uploadsByClient,
        },
      },
      meta: {
        performance: {
          responseTimeMs: responseTime,
          under200ms: responseTime < 200,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    sendError(res, 500, "Failed to fetch stats", { error });
    next(error);
  }
});

// GET /api/admin/clients/:id - Get a specific client
// router.get("/:id", async (req, res, next) => {
//   try {
//     // TODO: Implement endpoint
//     const { id } = req.params;
//     // Optional: validate UUID format
//     const uuidRegex = /^[0-9a-fA-F-]{36}$/;
//     if (!uuidRegex.test(id)) {
//       return sendError(res, 400, "Invalid UUID format");
//     }

//     const client = await prisma.client.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         email: true,
//         firstName: true,
//         createdAt: true,
//         uploadLinks: {
//           select: {
//             id: true,
//             createdAt: true,
//             isActive: true,
//             status: true,
//             uploads: {
//               select: {
//                 id: true,
//                 fileName: true, // adjust to your schema
//               },
//             },
//           },
//         },
//         _count: {
//           select: { uploadLinks: true },
//         },
//       },
//     });

//     if (!client) {
//       return sendError(res, 404, "Client not found");
//     }
//     res.json({
//       data: client,
//       meta: {
//         requestedId: id,
//         retrievedAt: new Date().toISOString(),
//       },
//     });
//   } catch (error) {
//     sendError(res, 500, "Failed to fetch client", { error });
//     next(error);
//   }
// });

// POST /api/admin/clients - Create a new client
// router.post("/", validate(createClientSchema), async (req, res, next) => {
//   try {
//     // TODO: Implement endpoint
//     const { email, phone, firstName, lastName, company, status } = req.body;
//     const client = await prisma.client.create({
//       data: {
//         email,
//         phone,
//         ...(firstName && { firstName }), // optional fields are omitted entirely if not provided.
//         ...(lastName && { lastName }),
//         ...(company && { company }),
//         status,
//       },
//       select: {
//         id: true, // UUID string
//         email: true,
//         phone: true,
//         firstName: true,
//         lastName: true,
//         company: true,
//         status: true,
//         createdAt: true,
//       },
//     });
//     res.status(201).json({
//       data: client,
//       meta: {
//         createdAt: new Date().toISOString(),
//       },
//     });
//   } catch (error: any) {
//     if (
//       error instanceof Prisma.PrismaClientKnownRequestError &&
//       error.code === "P2002"
//     ) {
//       const target = error.meta?.target as string[] | undefined;
//       let field = "unknown";
//       if (Array.isArray(target)) field = target.join(", ");
//       else if (typeof target === "string") field = target;
//       return sendError(res, 409, `Duplicate value for field: ${field}`, {
//         code: error.code,
//       });
//     }
//     sendError(res, 500, "Failed to create client", { error });
//     next(error);
//   }
// });

// PUT /api/admin/clients/:id - Update a client
// router.put("/:id", validate(updateClientSchema), async (req, res, next) => {
//   try {
//     // TODO: Implement endpoint
//     const { id } = req.params; //UUID string
//     const data = req.body;
//     //  Optional: validate UUID format
//     const uuidRegex = /^[0-9a-fA-F-]{36}$/;
//     if (!uuidRegex.test(id)) {
//       return sendError(res, 400, "Invalid UUID format");
//     }

//     const updatedClient = await prisma.client.update({
//       where: { id },
//       data,
//       select: {
//         id: true,
//         email: true,
//         phone: true,
//         firstName: true,
//         lastName: true,
//         company: true,
//         status: true,
//         updatedAt: true,
//       },
//     });
//     res.status(200).json({
//       data: updatedClient,
//       meta: {
//         updatedAt: new Date().toISOString(),
//         requestedId: id,
//       },
//     });
//   } catch (error: unknown) {
//     // Narrow to Prisma known error
//     if (
//       error instanceof Prisma.PrismaClientKnownRequestError &&
//       error.code === "P2025"
//     ) {
//       return sendError(res, 404, "Client not found", { code: error.code });
//     }
//     // Optional: handle constraint violations (e.g., unique email)
//     if (
//       error instanceof Prisma.PrismaClientKnownRequestError &&
//       (error.code === "P2002" || error.code === "P2003")
//     ) {
//       return sendError(res, 409, "Constraint violation", { code: error.code });
//     }
//     sendError(res, 500, "Failed to update client", { error });
//     next(error);
//   }
// });

// DELETE /api/admin/clients/:id - Delete a client
// router.delete("/:id", async (req, res, next) => {
//   try {
//     // TODO: Implement endpoint
//     const { id } = req.params; // UUID string
//     // Optional: validate UUID format
//     const uuidRegex = /^[0-9a-fA-F-]{36}$/;
//     if (!uuidRegex.test(id)) {
//       return sendError(res, 400, "Invalid UUID format");
//     }

//     const deletedClient = await prisma.client.delete({
//       where: { id },
//       select: {
//         id: true,
//         email: true,
//         phone: true,
//         firstName: true,
//         lastName: true,
//         company: true,
//         status: true,
//       },
//     });
//     res.status(200).json({
//       data: deletedClient,
//       meta: {
//         deletedAt: new Date().toISOString(),
//         requestedId: id,
//         message: "Client deleted successfully",
//       },
//     });
//   } catch (error: any) {
//     if (
//       error instanceof Prisma.PrismaClientKnownRequestError &&
//       error.code === "P2025"
//     ) {
//       return sendError(res, 404, "Client not found", { code: error.code });
//     } else {
//       sendError(res, 500, "Failed to delete client", { error });

//       next(error);
//     }
//   }
// });

export default router;
