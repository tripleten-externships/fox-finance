import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validation";
import {
  createClientSchema,
  updateClientSchema,
} from "../../schemas/client.schema";

const router = Router();

// GET /api/admin/clients - List all clients
router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min((Number.isInteger(Number(req.query.limit)) && Number(req.query.limit) > 0 
    ? Number(req.query.limit) 
    : 20), 
    100
  );

    const cursor = req.query.cursor

    const users = await prisma.user.findMany({
      take: limit,
      ...(cursor ? {skip:1, cursor: {id: String(cursor)}} : {}),
      where: {
        name: req.query.search ? {contains: String(req.query.search), mode: 'insensitive'} : undefined,
      },
      orderBy: { createdAt: "desc" },
      });

      const total = await prisma.user.count({
        where: {
        name: req.query.search ? {contains: String(req.query.search)} : undefined,
        },
      })

      res.setHeader("X-Total-Count", total);
      res.json({
        items: users,
        total,
        pageSize: limit,
        totalPages: Math.ceil(total / limit), // UI convenience only
        nextCursor: users.length === limit ? users[users.length -1].id : null,
      })
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/clients/:id - Get a specific client
router.get("/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
  where: {
      id: req.params.id,
  },
    })

    res.json({
      id: user?.id,
      name: user?.name,
      email: user?.email,
      createdAt: user?.createdAt,
      updatedAt: user?.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/clients - Create a new client
router.post("/", validate(createClientSchema), async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/clients/:id - Update a client
router.put("/:id", validate(updateClientSchema), async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/clients/:id - Delete a client
router.delete("/:id", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

export default router;
