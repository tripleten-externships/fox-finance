import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validation";
import {
  createClientSchema,
  updateClientSchema,
} from "../../schemas/client.schema";
import zod from "zod";

const router = Router();

// GET / List all clients
router.get("/", async (req, res, next) => {
  try {
    const limit = zod
      .number()
      .int()
      .max(100)
      .default(20)
      .parse(req.query.limit);

    const cursor = req.query.cursor;
    
    // Client search & filter
     const search = req.query.search ? String(req.query.search) : undefined;
     const status = req.query.status ? String(req.query.status) : undefined;

    const where: Record<string, any> = {};
    
    if (status) {
      if (["active", "inactive"].includes(status)) {
        where.status = status;
      }
    }

    if (search) {
      const searchTerm = search;
      where.OR = [
        {firstName: { contains: searchTerm, mode: "insensitive"}},
        {lastName: { contains: searchTerm, mode: "insensitive"}},
        {email: { contains: searchTerm, mode: "insensitive"}},
        {companyName: { contains: searchTerm, mode: "insensitive"}},
      ]
    }
    // 

    const users = await prisma.user.findMany({
      take: limit,
      ...(cursor ? { skip: Number(cursor) } : {}),
 
      //use new variable above
      
      // where: {
      //   name: req.query.search
      //     ? { contains: String(req.query.search), mode: "insensitive" }
      //     : undefined,
      // },
      orderBy: { createdAt: "desc" },
    });

    const count = await prisma.user.count({
      where: {
        name: req.query.search
          ? { contains: String(req.query.search) }
          : undefined,
      },
    });

    res.setHeader("X-Total-Count", count);
    res.json({
      items: users,
      count,
      pageSize: limit,
      totalPages: Math.ceil(count / limit), // UI convenience only
      next: users.length === limit ? users[users.length - 1].id : null,
    });
  } catch (error) {
    next(error);
  }
});

// GET / Get a specific client
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await prisma.client.findUnique({
      where: { id: id },
    });

    if (!result) {
      return res.status(404).json({
        message: "Client not found. Please check the ID and try again.",
      });
    }

    res.status(200).json({
      message: "Client details retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST / Create a new client
router.post("/", validate(createClientSchema), async (req, res, next) => {
  try {
    const { firstName, lastName, email, company, phone } = req.body;

    const result = await prisma.client.create({
      data: { firstName, lastName, email, company, phone },
    });

    res.status(201).json({
      message: "Client created successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// PUT / Update a client
router.put("/:id", validate(updateClientSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, company, phone } = req.body;

    const updated = await prisma.client.update({
      where: { id: id },
      data: { firstName, lastName, email, company, phone },
    });

    res.status(200).json({
      message: "Client information updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE / Delete a client
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await prisma.client.delete({
      where: { id: id },
    });

    res.status(200).json({
      message: "Client deleted successfully.",
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
