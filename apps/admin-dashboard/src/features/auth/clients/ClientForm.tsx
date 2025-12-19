// imports
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateClientInput } from '../../../../../api/src/schemas/client.schema';
import { createClientSchema } from '../../../../../api/src/schemas/client.schema';

export default function ClientForm() {
  const [fullName, setFullName] = useState('');
  const [phoneDisplay, setPhoneDisplay] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
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

  // Watch for changes to show real-time feedback
  const watchedEmail = watch('email');
  const watchedFirstName = watch('firstName');
  const watchedLastName = watch('lastName');

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
      // Submit to API here
      // await createClient(data);
      reset(); // Reset form after successful submit
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <div className="create-client_container">
      <h1 className="client-form_title">Create Client</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="create-client_form">
        
        {/* Full Name Input */}
        <div className="form-field">
          <label htmlFor="fullName">Full Name:</label>
          <input 
            id="fullName"
            type="text" 
            value={fullName}
            onChange={handleNameUpdate}
            placeholder="Enter first and last name"
            className={`form-input ${
              (errors.firstName || errors.lastName) ? 'error' : 
              (watchedFirstName && watchedLastName) ? 'valid' : ''
            }`}
          />
          
          {/* Name-specific error messages */}
          {errors.firstName && (
            <span className="error-message">
              <i className="error-icon">⚠</i>
              {errors.firstName.message}
            </span>
          )}
          {errors.lastName && (
            <span className="error-message">
              <i className="error-icon">⚠</i>
              {errors.lastName.message}
            </span>
          )}
          
          {/* Success indicator */}
          {watchedFirstName && watchedLastName && !errors.firstName && !errors.lastName && (
            <span className="success-message">
              <i className="success-icon">✓</i>
              Name looks good!
            </span>
          )}
        </div>

        {/* Email Input */}
        <div className="form-field">
          <label htmlFor="email">Email:</label>
          <input 
            id="email"
            type="email" 
            {...register("email", {
              onChange: handleEmailValidation
            })}
            placeholder="Enter email address"
            className={`form-input ${
              errors.email ? 'error' : 
              watchedEmail && !errors.email ? 'valid' : ''
            }`}
          />
          
          {errors.email && (
            <span className="error-message">
              <i className="error-icon">⚠</i>
              {errors.email.message}
            </span>
          )}
          
          {watchedEmail && !errors.email && (
            <span className="success-message">
              <i className="success-icon">✓</i>
              Email format is valid
            </span>
          )}
        </div>

        {/* Company Input */}
        <div className="form-field">
          <label htmlFor="company">Company:</label>
          <input 
            id="company"
            type="text" 
            {...register("company", {
              onChange: () => trigger('company')
            })}
            placeholder="Enter company name (optional)"
            className={`form-input ${
              errors.company ? 'error' : 
              watch('company') ? 'valid' : ''
            }`}
          />
          
          {errors.company && (
            <span className="error-message">
              <i className="error-icon">⚠</i>
              {errors.company.message}
            </span>
          )}
        </div>

        {/* Phone Input */}
        <div className="form-field">
          <label htmlFor="phone">Phone Number:</label>
          <input 
            id="phone"
            type="tel" 
            value={phoneDisplay}
            onChange={handlePhoneUpdate}
            placeholder="(123) 456-7890"
            maxLength={17}
            className={`form-input ${
              errors.phone ? 'error' : 
              watch('phone') && !errors.phone ? 'valid' : ''
            }`}
          />
          
          {errors.phone && (
            <span className="error-message">
              <i className="error-icon">⚠</i>
              {errors.phone.message}
            </span>
          )}
          
          {watch('phone') && !errors.phone && (
            <span className="success-message">
              <i className="success-icon">✓</i>
              Phone format is valid
            </span>
          )}
        </div>

        {/* Hidden inputs for react-hook-form */}
        <input type="hidden" {...register("firstName")} />
        <input type="hidden" {...register("lastName")} />
        <input type="hidden" {...register("phone")} />

        <div className="buttons_container">
          <button 
            type="submit" 
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className="submit-button"
          >
            {isSubmitting ? 'Creating...' : 'Create Client'}
          </button>
          <button type="button" className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
}
