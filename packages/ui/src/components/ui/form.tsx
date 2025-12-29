

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,

} from "react-hook-form";


// import { cn } from "@/utils/index";
//I changed the above to
import { cn } from "../../utils";


// -----------------------------
// Form Root (wraps your <form>)
// -----------------------------
const Form = FormProvider;

// -----------------------------
// FormField (connects RHF to UI)
// -----------------------------
function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: ControllerProps<TFieldValues, TName>) {
  return <Controller {...props} />;
}


// -----------------------------
// FormItem (wrapper for each field)
// -----------------------------
function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props} />
  );
}

// -----------------------------
// FormLabel
// -----------------------------
const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
FormLabel.displayName = "FormLabel";

// -----------------------------
// FormControl (wraps Input, Select, etc.)
// -----------------------------
const FormControl = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ ...props }, ref) => {
  return <Slot ref={ref} {...props} />;
});
FormControl.displayName = "FormControl";

// -----------------------------
// FormDescription
// -----------------------------
function FormDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

// -----------------------------
// FormMessage (Zod error messages)
// -----------------------------
function FormMessage({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { name?: string }) {
  const { formState } = useFormContext();
  const error = props.name ? formState.errors?.[props.name] : null;

  if (!error) return null;

  return (
    <p
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {error.message?.toString()}
    </p>
  );
}

// -----------------------------
// Exports
// -----------------------------
export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
};