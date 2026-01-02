
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
      .email("Invalid email address"),

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
    id: z.string().uuid("Client ID must be a valid UUID"),
  }),
});

// -----------------------------
// FORM SCHEMA (client-side)
// -----------------------------
export const clientFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  company: z.string().optional().nullable(),
  phone: z.string().optional(),
});

// Form type
export type ClientFormValues = z.infer<typeof clientFormSchema>;