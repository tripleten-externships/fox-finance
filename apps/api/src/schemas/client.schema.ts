import { z } from "zod";

// -----------------------------
// CREATE CLIENT SCHEMA (Zod v4)
// -----------------------------
export const createClientSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(100, "First name is too long"),

    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(100, "Last name is too long"),

    email: z
      .string()
      .min(1, "Email is required")
      .email({ message: "Invalid email address" }),

    company: z
      .string()
      .max(200, "Company name is too long")
      .optional()
      .nullable(),

    phone: z
      .string()
      .regex(
        /^(?:\+1\s?)?(?:\(?[2-9][0-9]{2}\)?)[\s-]?(?:[2-9][0-9]{2})[\s-]?[0-9]{4}$/,
        "Phone number must be digits with optional +1"
      )
      .optional(),
  }),
});

// -----------------------------
// UPDATE CLIENT SCHEMA (Zod v4)
// -----------------------------
export const updateClientSchema = z.object({
  params: z.object({
    id: z.string().uuid({ version: "v4", message: "Invalid UUID format" }),
  }),

  body: z
    .object({
      firstName: z
        .string()
        .trim()
        .min(1, "First name cannot be empty")
        .max(100, "First name is too long")
        .optional(),

      lastName: z
        .string()
        .trim()
        .min(1, "Last name cannot be empty")
        .max(100, "Last name is too long")
        .optional(),

      email: z
        .string()
        .email({ message: "Email must be valid" })
        .optional()
        .nullable(),

      company: z.string().max(200).optional().nullable(),

      phone: z
        .string()
        .regex(
          /^(?:\+1\s?)?(?:\(?[2-9][0-9]{2}\)?)[\s-]?(?:[2-9][0-9]{2})[\s-]?[0-9]{4}$/,
          "Phone must be digits with optional +1"
        )
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),
});

// -----------------------------
// TYPES
// -----------------------------
export type CreateClientInput = z.infer<typeof createClientSchema>["body"];
export type UpdateClientInput = z.infer<typeof updateClientSchema>["body"];
