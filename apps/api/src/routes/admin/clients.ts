import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validation";
import {
  createClientSchema,
  updateClientSchema,
} from "../../schemas/client.schema";

const router = Router();

// GET / List all clients
router.get("/api/admin/clients", async (req, res, next) => {
  try {
    const result = await prisma.client.findMany();
    res.status(200).json({
      message: "Clients retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// GET / Get a specific client
router.get("/api/admin/clients/:id", async (req, res, next) => {
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
router.post("/api/admin/clients", async (req, res, next) => {
  try {
    console.log("Body", req.body)
    const { firstName, lastName,email,company, phone } = req.body;

    const result = await prisma.client.create({
      data: { firstName, lastName,email,company, phone },
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
router.put("/api/admin/clients/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName,email,company, phone   } = req.body;

    const updated = await prisma.client.update({
      where: { id: id },
      data: { firstName, lastName,email,company, phone  },
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
router.delete("/api/admin/clients/:id", async (req, res, next) => {
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
