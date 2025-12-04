import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validation";
import {
  degradeIfDatabaseUnavailable,
  UnavailableError,
} from "../../utils/degredation";
import {
  createClientSchema,
  updateClientSchema,
} from "../../schemas/client.schema";

const router = Router();

// GET /api/admin/clients - List all clients
router.get("/", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    const clients = await degradeIfDatabaseUnavailable(() =>
      // finds all clients including their upload links
      prisma.client.findMany({
        include: { uploadLinks: true },
      })
    );
    res.status(200).json(clients);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/clients/:id - Get a specific client
router.get("/:id", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    const clientById = await degradeIfDatabaseUnavailable(() =>
      // finds a client by ID
      prisma.client.findUnique({
        where: { id: req.params.id },
      })
    );
    res.status(200).json(clientById);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/clients - Create a new client
router.post("/", validate(createClientSchema), async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    const client = await degradeIfDatabaseUnavailable(() =>
      // creates a new client
      prisma.client.create({
        data: req.body,
      })
    );
    res.status(200).json(client);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/clients/:id - Update a client
router.put("/:id", validate(updateClientSchema), async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    const updateClient = await degradeIfDatabaseUnavailable(() =>
      // updates a client by ID
      prisma.client.update({
        where: { id: req.params.id },
        data: req.body,
      })
    );
    res.status(200).json(updateClient);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/clients/:id - Delete a client
router.delete("/:id", async (req, res, next) => {
  try {
    const deletedClient = await degradeIfDatabaseUnavailable(() =>
      prisma.client.delete({
        where: { id: req.params.id },
      })
    );
    res.status(200).json(deletedClient);
  } catch (error) {
    next(error);
  }
});

export default router;
