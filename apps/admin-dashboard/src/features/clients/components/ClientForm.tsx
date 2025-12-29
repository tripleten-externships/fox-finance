import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../../../../packages/ui/src/components/ui/input"
import { Button }  from "../../../../../../packages/ui/src/components/ui/button"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
}  from "../../../../../../packages/ui/src/components/ui/form"

// ⬇️ Import your existing schema + types
import type { ClientFormValues } from "../../../../../api/src/schemas/client.schema"
import { clientFormSchema} from "../../../../../api/src/schemas/client.schema"

//Inside ui/src/index.ts added the following export
// ⭐ Export Form components
// export {
//   Form,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormControl,
//   FormMessage,
// } from "./components/ui/form";




interface ClientFormProps {
  mode: "create" | "edit";
  initialValues?: ClientFormValues;
  onSubmit: (values: ClientFormValues) => void;
  onChange?: () => void;
}

export default function ClientForm({
  mode,
  initialValues,
  onSubmit,
  onChange,
}: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: initialValues ?? {
      firstName: "",
       lastName: "",
      email: "",
      phone: "",
      company: "",
    },
  });

  // Change tracking
  useEffect(() => {
    const subscription = form.watch(() => {
      onChange?.();
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onChange]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });
// Reset form when initialValues change
  useEffect(() => {
  if (initialValues) {
    form.reset(initialValues);
  }
  }, [initialValues]);
  // Prevent unnecessary change tracking on initial load
  useEffect(() => {
  const subscription = form.watch((_, { name }) => {
    if (name) onChange?.();
  });
  return () => subscription.unsubscribe();
  }, [form.watch, onChange]);
  
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">

        {/* Name */}
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Client name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Email address"
                  {...field}
                  disabled={mode === "edit"} // disable in edit mode
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="Phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Company */}
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input placeholder="Company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {mode === "create" ? "Create Client" : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}