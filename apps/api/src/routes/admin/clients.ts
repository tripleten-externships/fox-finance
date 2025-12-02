import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validation";
import {
  createClientSchema,
  updateClientSchema,
} from "../../schemas/client.schema";

const router = Router();

// GET / List all clients
router.get("/", async (req, res, next) => {
  try {
    const { startPageNo, limit } = req.body;
    const skip = (startPageNo - 1) * limit;

    const result = await prisma.client.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      message: "Clients retrieved successfully.",
      page: startPageNo,
      count: result.length,
      data: result,
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
      where: { clientId: id },
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
    const { clientName, clientMobileNo } = req.body;

    const result = await prisma.client.create({
      data: { clientName, clientMobileNo },
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
    const { clientName, clientMobileNo } = req.body;

    const updated = await prisma.client.update({
      where: { clientId: id },
      data: { clientName, clientMobileNo },
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
      where: { clientId: id },
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
