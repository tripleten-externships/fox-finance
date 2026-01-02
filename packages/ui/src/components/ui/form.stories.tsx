import type { Meta } from "@storybook/react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "./form";
import { useForm } from "react-hook-form";
import { Button } from "./button";
import { Input } from "./input";

const meta: Meta<typeof Form> = {
  title: "Components/UI/Form",
  component: Form,
};

export default meta;

export const Default = () => {
  const form = useForm({
    defaultValues: { username: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => console.log(data))} className="space-y-4">
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
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};