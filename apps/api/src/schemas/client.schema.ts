import { z } from "zod";

export const createClientSchema = z.object({
  body: z.object({
    firstName: z.string({ required_error: "First name is required"})
    .trim()
    .min(1, "First name cannot be empty")
    .max(100, "First name is too long"),
    lastName: z.string({ required_error: "Last name is required"})
    .trim()
    .min(1, "Last name cannot be empty")
    .max(100, "Last name is too long"),
    email: z.string({required_error: "Email is required"})
    .email("Invalid email address"),
    company: z.string().max(200, "Company name is too long").optional().nullable(),
    phone: z.string().regex(/^(?:\+1\s?)?(?:\(?[2-9][0-9]{2}\)?)[\s-]?(?:[2-9][0-9]{2})[\s-]?[0-9]{4}$/, "Phone number must be digits with optional +1").optional(),
  }),
});

export const updateClientSchema = z.object({
  params: z.object({
    id: z.string().uuid("Client ID must be a valid UUID"),
  }),
  body: z.object({
    firstName: z.string().trim().min(1, "First name cannot be empty").max(100, "First name is too long").optional(),
    lastName: z.string().trim().min(1, "Last name cannot be empty").max(100, "Last name is too long").optional(),
    email: z.string().email("Email must be valid").optional().nullable(),
    company: z.string().max(200).optional().nullable(),
    phone: z.string().regex(/^(?:\+1\s?)?(?:\(?[2-9][0-9]{2}\)?)[\s-]?(?:[2-9][0-9]{2})[\s-]?[0-9]{4}$/, "Phone must be digits with optional +1").optional(),
  }).refine(
    data => Object.keys(data).length > 0,
    { message: "At least one field must be provided for update" }
  )
});
//compile-time validation---gives error
export type CreateClientInput = z.infer<typeof createClientSchema>["body"];
<<<<<<< HEAD
export type UpdateClientInput = z.infer<typeof updateClientSchema>["body"];
=======
export type UpdateClientInput = z.infer<typeof updateClientSchema>["body"];

>>>>>>> 6679233689eb333bd116078b5b16269f701f087c
