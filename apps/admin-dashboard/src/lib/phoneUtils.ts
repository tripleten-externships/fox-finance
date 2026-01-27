/**
 * Phone number utility functions for formatting and unformatting phone numbers.
 * These utilities handle US phone numbers in the format (XXX) XXX-XXXX.
 */

/**
 * Formats a phone number string to display as (XXX) XXX-XXXX.
 * Handles edge cases like null, undefined, empty strings, and partial numbers.
 *
 * @param phone - The phone number to format (can be digits only or already formatted)
 * @returns Formatted phone number string, or empty string if invalid input
 *
 * @example
 * formatPhoneNumber("9199739228") // returns "(919) 973-9228"
 * formatPhoneNumber("919") // returns "919"
 * formatPhoneNumber("") // returns ""
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  // Handle null, undefined, or empty strings
  if (!phone) return "";

  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Return empty string if no digits
  if (digits.length === 0) return "";

  // Limit to 10 digits
  const limited = digits.slice(0, 10);

  // Format as (XXX) XXX-XXXX
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
};

/**
 * Removes all formatting from a phone number to get digits only.
 * Useful for storing phone numbers in the database or API calls.
 *
 * @param phone - The phone number to unformat (can be formatted or unformatted)
 * @returns String containing only digits, or empty string if invalid input
 *
 * @example
 * unformatPhoneNumber("(919) 973-9228") // returns "9199739228"
 * unformatPhoneNumber("919-973-9228") // returns "9199739228"
 * unformatPhoneNumber("") // returns ""
 */
export const unformatPhoneNumber = (
  phone: string | null | undefined,
): string => {
  // Handle null, undefined, or empty strings
  if (!phone) return "";

  // Strip all non-digit characters to get digits only
  return phone.replace(/\D/g, "");
};
