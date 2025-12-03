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
                 clientName:z.String("Client Name Should not be Empty").min(3),
                 clientMobileNo:z.String().Optional(),
                 clientEmail:z.String().email()
                   
                }),
});

export const updateClientSchema = z.object({
  params: z.object({id:z.String()}),
  body: z.object({
                  clientName:z.String("Client Name Should not be Empty").min(3),
                  clientMobileNo:z.String().Optional(),
                   clientEmail:z.String().email()
                }),
});
//compile-time validation---gives error
export type CreateClientInput = z.infer<typeof createClientSchema>["body"];
export type UpdateClientInput = z.infer<typeof updateClientSchema>["body"];