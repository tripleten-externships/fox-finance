import { z } from "zod";

// TODO: Define your validation schemas here
// Example:
// export const createClientSchema = z.object({
//   body: z.object({
//     email: z.string().email(),
//     firstName: z.string().min(1),
//     lastName: z.string().min(1),
//   }),
// });

export const createClientSchema = z.object({
  body: z.object({}),
});

export const updateClientSchema = z.object({
  params: z.object({}),
  body: z.object({}),
});

export type CreateClientInput = z.infer<typeof createClientSchema>["body"];
export type UpdateClientInput = z.infer<typeof updateClientSchema>["body"];
