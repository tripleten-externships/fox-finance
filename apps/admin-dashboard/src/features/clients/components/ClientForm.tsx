import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Relative paths to your UI package components
import { Input } from "../../../../../../packages/ui/src/components/ui/input";
import { Button } from "../../../../../../packages/ui/src/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../../../../../../packages/ui/src/components/ui/form";

// Import schema and types from the API package
import { clientFormSchema, type ClientFormValues } from "../../../../../api/src/schemas/client.schema";

interface ClientFormProps {
  mode: "create" | "edit";
  initialValues?: ClientFormValues;
  onSubmit: (values: ClientFormValues, isDirty: boolean) => void;
  isLoading?: boolean;
}

export default function ClientForm({
  mode,
  initialValues,
  onSubmit,
  isLoading,
}: ClientFormProps) {
  const form = useForm<ClientFormValues>({ 
    // We cast the resolver to any to stop the 'ResolverSuccess' loop
    resolver: zodResolver(clientFormSchema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      phone: "",
      status: "ACTIVE",
    }
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values, isDirty);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* First Name */}
          <FormField
            control={form.control as any}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control as any}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email */}
        <FormField
          control={form.control as any}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  value={field.value ?? ""}
                  type="email" 
                  disabled={mode === "edit"} 
                  className={mode === "edit" ? "bg-slate-50 opacity-70" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control as any}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="+1..." {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Company */}
        <FormField
          control={form.control as any}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input placeholder="Company Inc." {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : mode === "create" ? "Create Client" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}