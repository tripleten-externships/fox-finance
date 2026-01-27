import { useState, useEffect } from "react";
import { Button, Input, toast } from "@fox-finance/ui";
import { apiClient } from "../../../lib/api";
import {
  formatPhoneNumber,
  unformatPhoneNumber,
} from "../../../lib/phoneUtils";

interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string | null;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

interface CreateClientFormProps {
  onSuccess?: () => void;
  client?: Client; // Optional client prop for edit mode
}

interface CreateClientPayload {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  phone: string;
}

export default function CreateClientForm({
  onSuccess,
  client,
}: CreateClientFormProps) {
  const isEditMode = !!client;

  const [formData, setFormData] = useState<CreateClientPayload>({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
  });

  // Initialize form with client data when in edit mode
  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        company: client.company || "",
        phone: formatPhoneNumber(client.phone), // Format phone for display
      });
    }
  }, [client]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateClientPayload, string>>
  >({});

  // Handle input changes
  const handleChange = (field: keyof CreateClientPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Special handler for phone input with formatting
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
    // Clear error for phone field when user starts typing
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateClientPayload, string>> = {};

    // Required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length > 100) {
      newErrors.firstName = "First name is too long (max 100 characters)";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.length > 100) {
      newErrors.lastName = "Last name is too long (max 100 characters)";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    // Optional fields with validation
    if (formData.company && formData.company.length > 200) {
      newErrors.company = "Company name is too long (max 200 characters)";
    }

    // Phone is required and must be exactly 10 digits
    const phoneDigits = unformatPhoneNumber(formData.phone);
    if (!phoneDigits) {
      newErrors.phone = "Phone number is required";
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    // Prepare payload
    const payload: CreateClientPayload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: unformatPhoneNumber(formData.phone), // Store as digits only
    };

    // For edit mode, always include company (even if empty) to allow clearing
    // For create mode, only include if non-empty
    if (isEditMode) {
      payload.company = formData.company?.trim() || "";
    } else if (formData.company?.trim()) {
      payload.company = formData.company.trim();
    }

    try {
      const url = isEditMode
        ? `/api/admin/clients/${client.id}`
        : "/api/admin/clients";
      const method = isEditMode ? "PUT" : "POST";

      const res = await apiClient(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Failed to ${isEditMode ? "update" : "create"} client`,
        );
      }

      const data = await res.json();
      toast(
        `Client ${isEditMode ? "updated" : "created"} successfully: ${data.data.firstName} ${data.data.lastName}`,
      );

      // Reset form only in create mode
      if (!isEditMode) {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          company: "",
          phone: "",
        });
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast(
        error.message || `Failed to ${isEditMode ? "update" : "create"} client`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* First Name */}
      <div className="space-y-2">
        <label
          htmlFor="firstName"
          className="text-sm font-medium text-foreground"
        >
          First Name <span className="text-destructive">*</span>
        </label>
        <Input
          id="firstName"
          type="text"
          value={formData.firstName}
          onChange={(e) => handleChange("firstName", e.target.value)}
          placeholder="John"
          disabled={isSubmitting}
          className={errors.firstName ? "border-destructive" : ""}
        />
        {errors.firstName && (
          <p className="text-sm text-destructive">{errors.firstName}</p>
        )}
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <label
          htmlFor="lastName"
          className="text-sm font-medium text-foreground"
        >
          Last Name <span className="text-destructive">*</span>
        </label>
        <Input
          id="lastName"
          type="text"
          value={formData.lastName}
          onChange={(e) => handleChange("lastName", e.target.value)}
          placeholder="Doe"
          disabled={isSubmitting}
          className={errors.lastName ? "border-destructive" : ""}
        />
        {errors.lastName && (
          <p className="text-sm text-destructive">{errors.lastName}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email <span className="text-destructive">*</span>
        </label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="john.doe@example.com"
          disabled={isSubmitting}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      {/* Company */}
      <div className="space-y-2">
        <label
          htmlFor="company"
          className="text-sm font-medium text-foreground"
        >
          Company
        </label>
        <Input
          id="company"
          type="text"
          value={formData.company}
          onChange={(e) => handleChange("company", e.target.value)}
          placeholder="Acme Inc."
          disabled={isSubmitting}
          className={errors.company ? "border-destructive" : ""}
        />
        {errors.company && (
          <p className="text-sm text-destructive">{errors.company}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium text-foreground">
          Phone <span className="text-destructive">*</span>
        </label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="(919) 973-9228"
          disabled={isSubmitting}
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isEditMode
              ? "Updating..."
              : "Creating..."
            : isEditMode
              ? "Update Client"
              : "Create Client"}
        </Button>
      </div>
    </form>
  );
}
