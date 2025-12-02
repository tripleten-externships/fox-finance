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

    res.status(200).json({ message: "success", data: result });
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
    res.status(200).json({ message: "success", data: result });
  } catch (error) {
    next(error);
  }
});

// POST / Create a new client
router.post("/", validate(createClientSchema), async (req, res, next) => {
  try {
    const { clientName, clientMobileNo } = req.body;

    const result = await prisma.client.create({
      data: {
        clientName: clientName,
        clientMobileNo: clientMobileNo,
      },
    });

    res.status(201).json({ message: "Inserted", data: result });
  } catch (error) {
    next(error);
  }
});

// PUT / Update a client
router.put("/:id", validate(updateClientSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { clientName, clientMobileNo } = req.body;

    const result = await prisma.client.update({
      where: { clientId: id },
      data: {
        clientName: clientName,
        clientMobileNo: clientMobileNo,
      },
    });

    res.status(201).json({ message: "Updated", data: result });
  } catch (error) {
    next(error);
  }
});

// DELETE / Delete a client
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await prisma.client.delete({
      where: { clientId: id },
    });

    res.status(201).json({ message: "Deleted", data: result });
  } catch (error) {
    next(error);
  }
});

export default router;

