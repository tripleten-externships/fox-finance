import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./form";

import { Input } from "./input";
import { Button } from "./button";
// I created features/clients/components/clientForm.tsx & EdieClientModal.tsx
// I created two new files form.stories.tsx and form.tsx
// issue Cannot find module '@tanstack/react-query' poped up.
// I did cd apps/admin-dashboard & pnpm add @tanstack/react-query
// Added into tsconfig.app.json  [ /* REQUIRED for pnpm monorepos */ "baseUrl": ".",]
// after adding "baseUrl": ".": 1. restarted TS server "Ctrl + Shift + P → TypeScript: Restart TS Server"
//2. - Restart VS Code
// 3. - Run pnpm dev
// now  Cannot find module '@tanstack/react-query' issue solved
//to solve typescript issue, I updated all package.json's to "Zod":^3.22.4. Initially it was ^4.1.11

const schema = z.object({
  firstName: z.string().min(1),
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

const meta: Meta = {
  title: "UI/Form",
  component: Form,
};

export default meta;

export const Default: StoryObj = {
  render: () => {
    // 👇 Create a real React component so hooks are allowed
    const StoryForm = () => {
      const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
          firstName: "",
          email: "",
        },
      });

      const onSubmit = (values: FormValues) => {
        alert(JSON.stringify(values, null, 2));
      };

      return (
        <div className="max-w-sm p-6 border rounded-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </Form>
        </div>
      );
    };

    return <StoryForm />;
  },
};