/**
 * Email normalization and validation utilities (Backend)
 * 
 * Handles Gmail-specific normalization (dots and plus signs) to prevent
 * duplicate accounts for the same user with different email formats.
 */

/**
 * Normalizes email addresses, with special handling for Gmail domains
 * 
 * Gmail normalization rules:
 * - Removes dots from the local part (user.name@gmail.com → username@gmail.com)
 * - Removes plus tags (user+tag@gmail.com → user@gmail.com)
 * - Converts to lowercase
 * - Handles both gmail.com and googlemail.com domains
 * 
 * @param email - Raw email address
 * @returns Normalized email address
 * @throws Error if email format is invalid
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new Error('Email must be a non-empty string');
  }

  const trimmed = email.trim().toLowerCase();
  const [local, domain] = trimmed.split('@');
  
  if (!domain || !local) {
    throw new Error('Invalid email format: missing local part or domain');
  }

  // Gmail-specific normalization
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Remove plus tags (everything after +)
    const noPlus = local.split('+')[0] ?? local;
    // Remove dots from local part
    const normalizedLocal = noPlus.replace(/\./g, '');
    return `${normalizedLocal}@gmail.com`;
  }

  // For non-Gmail domains, just return normalized version
  return `${local}@${domain}`;
}

/**
 * Validates email format using a comprehensive regex
 * 
 * @param email - Email address to validate
 * @returns true if email format is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Comprehensive email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates and normalizes an email address in one step
 * 
 * @param email - Raw email address
 * @returns Normalized email address
 * @throws Error if email is invalid or normalization fails
 */
export function validateAndNormalizeEmail(email: string): string {
  const normalized = normalizeEmail(email);
  
  if (!isValidEmail(normalized)) {
    throw new Error(`Invalid email format: ${email}`);
  }
  
  return normalized;
}
