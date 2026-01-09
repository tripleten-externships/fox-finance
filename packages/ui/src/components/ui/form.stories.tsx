import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";
import { Button } from "./button";

const meta: Meta = {
  title: "UI/Form",
  parameters: {
    layout: "centered",
  },
};

export default meta;

// Mock Schema for the story
const demoSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
});

const FormDemo = () => {
  const form = useForm({
    resolver: zodResolver(demoSchema),
    defaultValues: { username: "", email: "" },
  });

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit((data) => console.log(data))} 
        className="w-[400px] space-y-6"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
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
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};

export const Default: StoryObj = {
  render: () => <FormDemo />,
};