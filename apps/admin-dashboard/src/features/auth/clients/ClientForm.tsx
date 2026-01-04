// imports
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateClientInput } from '../../../../../api/src/schemas/client.schema';
import { createClientSchema } from '../../../../../api/src/schemas/client.schema';
import { postClient } from "../../../lib/api";
//import elements
import { 
  Button, 
  Input , 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  
  toast
} from "@fox-finance/ui";

import {colors} from "../../../../../../packages/theme/src/tokens/colors"; // Ensure theme is loaded

interface ClientFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ClientForm({ open = true, onOpenChange }: ClientFormProps) {
  const [fullName, setFullName] = useState('');
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
   
    formState: { errors, isSubmitting },
    trigger, // For manual validation
    watch, // To watch field values
    reset // To reset the form
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema.shape.body),
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onChange', // Re-validate on change after first validation
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      phone: ''
    }
  });
const createClient = (data: CreateClientInput) => {
  return postClient(data);
};

  // Watch for changes to show real-time feedback
  const watchedEmail = watch('email');
  const watchedFirstName = watch('firstName');
  const watchedLastName = watch('lastName');
  const watchedPhone = watch('phone');

  // Check if all required fields are filled
  const isFormComplete = watchedFirstName && watchedLastName && watchedEmail && watchedPhone;

  const handleNameUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setFullName(inputValue);

    const names = inputValue.trim().split(' ');
    
    if (names.length >= 2) {
      const firstName = names[0];
      const lastName = names.slice(1).join(' ');
      
      setValue('firstName', firstName);
      setValue('lastName', lastName);
      
      // Trigger validation for both fields
      await trigger(['firstName', 'lastName']);
    } else if (names.length === 1 && names[0]) {
      setValue('firstName', names[0]);
      setValue('lastName', '');
      await trigger(['firstName', 'lastName']);
    } else {
      setValue('firstName', '');
      setValue('lastName', '');
    }
  };

  const handlePhoneUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const digitsOnly = inputValue.replace(/\D/g, '');
    
    // Format for display
    let formatted = '';
    if (digitsOnly.length < 4) {
      formatted = digitsOnly;
    } else if (digitsOnly.length < 7) {
      formatted = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    } else if (digitsOnly.length < 11) {
      formatted = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
    } else {
      formatted = `+${digitsOnly.slice(0, 1)} (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7, 11)}`;
    }
    
    setPhoneDisplay(formatted);
    setValue('phone', digitsOnly);
    
    // Trigger phone validation
    await trigger('phone');
  };

  const handleEmailValidation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setValue('email', email);
    
    // Trigger email validation
    await trigger('email');
    
    // Check for email uniqueness (optional)
    if (email && !errors.email) {
      // Add your email uniqueness check here
    }
  };

  const onSubmit = async (data: CreateClientInput) => {
    try {
      console.log('Form data:', data);
      await createClient(data);
      
      // Show success toast
      toast.success(`Client "${data.firstName} ${data.lastName}" created successfully!`, {
        description: "The client has been added to the system.",
        duration: 3000,
      });
      
      // Clear form
      reset();
      setFullName('');
      setPhoneDisplay('');
      
      // Close modal after brief delay
      setTimeout(() => {
        onOpenChange?.(false);
      }, 500);
      
    } catch (error) {
      console.error('Error creating client:', error);
      setErrorMessage('❌ Failed to create client. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
  };

  const handleCancel = () => {
    reset();
    setFullName('');
    setPhoneDisplay('');
    setErrorMessage(''); // Clear any error message
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="gap-6 !rounded-[10px]" 
        
      >
        <DialogHeader className="">
          <DialogTitle>Create Client Access</DialogTitle>
          
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-[8px] text-sm font-medium text-center bg-red-50 text-red-700 border border-red-200">
              {errorMessage}
            </div>
          )}

          {/* Full Name Input */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Client's Name
            </label>
            <Input 
              id="fullName"
              value={fullName}
              onChange={handleNameUpdate}
              placeholder="Enter first and last name"
              className="!rounded-[8px]"
            />
            
            {/* Name-specific error messages */}
            {errors.firstName && (
              <div className="flex items-center gap-1 text-sm" style={{ color: `hsl(${colors.error[500]})` }}>
                <span style={{ color: `hsl(${colors.error[500]})` }}>⚠</span>
                {errors.firstName.message}
              </div>
            )}
            {errors.lastName && (
              <div className="flex items-center gap-1 text-sm" style={{ color: `hsl(${colors.error[500]})` }}>
                <span style={{ color: `hsl(${colors.error[500]})` }}>⚠</span>
                {errors.lastName.message}
              </div>
            )}
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Client's Email
            </label>
            <Input 
              id="email"
              type="email"
              placeholder="Enter email address"
              className="!rounded-[8px]"
              {...register("email", {
                onChange: handleEmailValidation
              })}
            />
            
            {errors.email && (
              <div className="flex items-center gap-1 text-sm" style={{ color: `hsl(${colors.error[500]})` }}>
                <span style={{ color: `hsl(${colors.error[500]})` }}>⚠</span>
                {errors.email.message}
              </div>
            )}
          </div>

          {/* Phone Input */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </label>
            <Input 
              id="phone"
              type="tel"
              value={phoneDisplay}
              onChange={handlePhoneUpdate}
              placeholder="(123) 456-7890"
              maxLength={17}
              className="!rounded-[8px]"
            />
            
            {errors.phone && (
              <div className="flex items-center gap-1 text-sm" style={{ color: `hsl(${colors.error[500]})` }}>
                <span style={{ color: `hsl(${colors.error[500]})` }}>⚠</span>
                {errors.phone.message}
              </div>
            )}
          </div>

          {/* Hidden inputs for react-hook-form */}
          <input type="hidden" {...register("firstName")} />
          <input type="hidden" {...register("lastName")} />
          <input type="hidden" {...register("phone")} />

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              type="submit" 
              disabled={isSubmitting || Object.keys(errors).length > 0 || !isFormComplete}
              loading={isSubmitting}
              varient="destructive"
              className="flex-1 !rounded-[8px] hover:opacity-80 transition-opacity duration-200"
              style={{ backgroundColor: `hsl(${colors.neutral[950]})`, color: 'white' }}
              
            >
              {isSubmitting ? 'Creating...' : 'Create Client'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={handleCancel}
              varient="secondary"
              className="flex-1 !rounded-[8px] hover:opacity-70 transition-opacity duration-200"
              
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
