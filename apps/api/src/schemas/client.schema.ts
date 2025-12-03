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
  body: z.object({
    email: z.string().email(),
    status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    firstName: z.string().min(1, "First name can't be empty").optional(),
    lastName: z.string().min(1, "First name can't be empty").optional(),
    company: z
      .string()
      .max(100, "Company name can't be grater than 100 characters")
      .optional(),
  }),
});

export const updateClientSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid client id format"),
  }),
  body: z.object({
    email: z.string().email(),
    status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
     phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    firstName: z.string().min(1, "First name can't be empty").optional(),
    lastName: z.string().min(1, "First name can't be empty").optional(),
    company: z
      .string()
      .max(100, "Company name can't be grater than 100 characters")
      .optional(),
  }),
});

export type CreateClientInput = z.infer<typeof createClientSchema>["body"];
export type UpdateClientInput = z.infer<typeof updateClientSchema>["body"];
