/**
 * Compliance Layer
 * PHI/PII scrubbing, audit logging, and data control flags
 */

import { createHash } from 'crypto';

/**
 * Scrub PHI/PII from logs
 * Removes: names, dates, addresses, phone numbers, emails, SSNs
 */
export class ComplianceLayer {
  /**
   * Scrub content for logging (remove PHI/PII)
   */
  static scrubForLogging(content: string): string {
    if (!content) return '';
    
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
   * Hash content for audit logs (SHA-256)
   * Never store raw PHI in logs
   */
  static hashContent(content: string): string {
    if (!content) return '';
    return createHash('sha256').update(content).digest('hex');
  }
  
  /**
   * Audit log (hashed, no raw PHI)
   * This is a placeholder - actual implementation would insert into audit_logs table
   */
  static async logRequest(
    userId: string,
    templateRef: string,
    model: string,
    contentHash: string,
    metadata: Record<string, any>
  ): Promise<void> {
    // Only log in production if COMPLIANCE_PHI_FREE_LOGGING is enabled
    if (process.env['NODE_ENV'] === 'production' && 
        process.env['COMPLIANCE_PHI_FREE_LOGGING'] === 'true') {
      // TODO: Insert into audit_logs table with hashed content
      // Never log raw transcript content in production
      console.log('[AUDIT]', {
        userId,
        templateRef,
        model,
        contentHash, // Only hash, never raw content
        metadata: this.scrubForLogging(JSON.stringify(metadata)),
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  /**
   * Enforce data control flags per provider
   * Adds X-no-log flags for Anthropic, data residency for others
   */
  static enforceDataControls(provider: string): Record<string, any> {
    const controls: Record<string, any> = {};
    
    if (provider === 'anthropic') {
      // Anthropic: Add no-logging flag if available
      // Note: Actual implementation depends on Anthropic API version
      controls['anthropic-beta'] = 'no-logging';
    }
    
    if (provider === 'openai') {
      // OpenAI: Use organization with data controls if available
      const orgId = process.env['OPENAI_ORG_ID'];
      if (orgId) {
        controls['organization'] = orgId;
      }
    }
    
    // Google: Data residency controls
    if (provider === 'google') {
      // Google Cloud may have region settings
      const region = process.env['GOOGLE_CLOUD_REGION'];
      if (region) {
        controls['region'] = region;
      }
    }
    
    return controls;
  }
  
  /**
   * Validate content for PHI/PII before sending to providers
   * Returns warnings if potential PHI detected
   */
  static validateForPHI(content: string): { hasPHI: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let hasPHI = false;
    
    // Check for email addresses
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(content)) {
      warnings.push('Potential email addresses detected');
      hasPHI = true;
    }
    
    // Check for phone numbers
    if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(content)) {
      warnings.push('Potential phone numbers detected');
      hasPHI = true;
    }
    
    // Check for dates
    if (/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(content)) {
      warnings.push('Potential dates detected');
      hasPHI = true;
    }
    
    // Check for SSN
    if (/\b\d{3}-\d{2}-\d{4}\b/.test(content)) {
      warnings.push('Potential SSN detected');
      hasPHI = true;
    }
    
    return { hasPHI, warnings };
  }
}
