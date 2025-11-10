/**
 * Safe Logger Utility
 * Scrubs PHI/PII from logs and prevents sensitive keys from being exposed
 * Only logs in development mode in production
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Scrub PHI/PII from content for logging
 */
function scrubPHI(content: string): string {
  if (!content || typeof content !== 'string') return content;
  
  let scrubbed = content;
  
  // Remove email addresses
  scrubbed = scrubbed.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
  
  // Remove phone numbers (various formats)
  scrubbed = scrubbed.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]');
  scrubbed = scrubbed.replace(/\b\(\d{3}\)\s?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]');
  scrubbed = scrubbed.replace(/\b\d{10}\b/g, '[PHONE_REDACTED]');
  
  // Remove dates (various formats)
  scrubbed = scrubbed.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '[DATE_REDACTED]');
  scrubbed = scrubbed.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '[DATE_REDACTED]');
  
  // Remove SSN-like patterns
  scrubbed = scrubbed.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
  
  // Remove credit card-like patterns
  scrubbed = scrubbed.replace(/\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, '[CARD_REDACTED]');
  
  // Common medical identifiers (HIPAA)
  scrubbed = scrubbed.replace(/\bMRN[:\s]?\d+\b/gi, '[MRN_REDACTED]');
  scrubbed = scrubbed.replace(/\bAccount[:\s]?\d+\b/gi, '[ACCOUNT_REDACTED]');
  
  return scrubbed;
}

/**
 * Scrub sensitive keys from objects
 */
function scrubSensitiveKeys(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveKeys = [
    'api_key',
    'apiKey',
    'access_token',
    'accessToken',
    'token',
    'secret',
    'password',
    'auth',
    'authorization',
    'transcript',
    'transcript_content',
    'transcriptContent',
    'audio_data',
    'audioData',
    'patient_name',
    'patientName',
    'patient_id',
    'patientId',
    'medical_record_number',
    'medicalRecordNumber',
    'social_security_number',
    'socialSecurityNumber',
    'phone_number',
    'phoneNumber',
    'email',
    'address',
    'date_of_birth',
    'dateOfBirth',
    'diagnosis',
    'symptoms',
    'medications',
    'treatment_plan',
    'treatmentPlan'
  ];
  
  if (Array.isArray(obj)) {
    return obj.map(item => scrubSensitiveKeys(item));
  }
  
  const scrubbed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => keyLower.includes(sk.toLowerCase()));
    
    if (isSensitive) {
      if (typeof value === 'string' && value.length > 0) {
        scrubbed[key] = '[REDACTED]';
      } else {
        scrubbed[key] = '[REDACTED]';
      }
    } else if (typeof value === 'string') {
      scrubbed[key] = scrubPHI(value);
    } else if (typeof value === 'object' && value !== null) {
      scrubbed[key] = scrubSensitiveKeys(value);
    } else {
      scrubbed[key] = value;
    }
  }
  
  return scrubbed;
}

/**
 * Safe logger that scrubs PHI and only logs in development
 */
export const safeLogger = {
  log: (...args: any[]) => {
    if (!isDevelopment) return;
    const scrubbed = args.map(arg => {
      if (typeof arg === 'string') {
        return scrubPHI(arg);
      } else if (typeof arg === 'object' && arg !== null) {
        return scrubSensitiveKeys(arg);
      }
      return arg;
    });
    console.log(...scrubbed);
  },
  
  warn: (...args: any[]) => {
    if (!isDevelopment) return;
    const scrubbed = args.map(arg => {
      if (typeof arg === 'string') {
        return scrubPHI(arg);
      } else if (typeof arg === 'object' && arg !== null) {
        return scrubSensitiveKeys(arg);
      }
      return arg;
    });
    console.warn(...scrubbed);
  },
  
  error: (...args: any[]) => {
    // Always log errors, but scrub PHI
    const scrubbed = args.map(arg => {
      if (typeof arg === 'string') {
        return scrubPHI(arg);
      } else if (typeof arg === 'object' && arg !== null) {
        return scrubSensitiveKeys(arg);
      }
      return arg;
    });
    console.error(...scrubbed);
  },
  
  info: (...args: any[]) => {
    if (!isDevelopment) return;
    const scrubbed = args.map(arg => {
      if (typeof arg === 'string') {
        return scrubPHI(arg);
      } else if (typeof arg === 'object' && arg !== null) {
        return scrubSensitiveKeys(arg);
      }
      return arg;
    });
    console.info(...scrubbed);
  },
  
  debug: (...args: any[]) => {
    if (!isDevelopment) return;
    const scrubbed = args.map(arg => {
      if (typeof arg === 'string') {
        return scrubPHI(arg);
      } else if (typeof arg === 'object' && arg !== null) {
        return scrubSensitiveKeys(arg);
      }
      return arg;
    });
    console.debug(...scrubbed);
  },
};

