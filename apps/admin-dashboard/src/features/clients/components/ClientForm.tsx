import  { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "../../../../../../packages/ui/src/components/ui/form"; // Path inferred from Modal
import { Input } from "../../../../../../packages/ui/src/components/ui/input";
import { Button } from "../../../../../../packages/ui/src/components/ui/button";

// Use the schema body directly for the form fields
import { createClientSchema, type CreateClientInput } from "../../../../../api/src/schemas/client.schema";

interface ClientFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<CreateClientInput>;
  onSubmit: (values: CreateClientInput) => void;
  onChange?: () => void;
}

const ClientForm = ({ mode, initialValues, onSubmit, onChange }: ClientFormProps) => {
  // 1. Initialize Form
  const form = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema.shape.body),
    defaultValues: initialValues || {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      phone: "",
    },
  });

  
useEffect(() => {
  // form.watch() ensures this effect runs on every change
  form.watch(); 

  if (form.formState.isDirty && onChange) {
    onChange();
  }
}, [form.watch, form.formState.isDirty, onChange]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl><Input placeholder="John" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="john@example.com" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company (Optional)</FormLabel>
              <FormControl><Input placeholder="Acme Inc." {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl><Input placeholder="+1 (555) 000-0000" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" loading={form.formState.isSubmitting}>
            {mode === "edit" ? "Save Changes" : "Create Client"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;