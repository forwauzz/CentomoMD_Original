import winston from 'winston';
import { format } from 'winston';

// Custom format to ensure no PHI is logged
const phiFreeFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  // Remove any potential PHI fields from metadata
  const sanitizedMeta = sanitizeMetadata(meta);
  
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...sanitizedMeta
  });
});

// Sanitize metadata to remove potential PHI
function sanitizeMetadata(meta: any): any {
  if (!meta || typeof meta !== 'object') {
    return meta;
  }

  const sanitized: any = {};
  const phiFields = [
    'patient_name',
    'patient_id',
    'medical_record_number',
    'social_security_number',
    'phone_number',
    'email',
    'address',
    'date_of_birth',
    'transcript_content',
    'audio_data',
    'diagnosis',
    'symptoms',
    'medications',
    'treatment_plan'
  ];

  for (const [key, value] of Object.entries(meta)) {
    if (phiFields.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    phiFreeFormat
  ),
  defaultMeta: {
    service: 'centomo-md-backend',
    environment: process.env['NODE_ENV'] || 'development',
    region: process.env['AWS_REGION'] || 'ca-central-1'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    
    // File transport for production logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: 'logs/rejections.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add audit logging for compliance
export const auditLogger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.json()
  ),
  defaultMeta: {
    service: 'centomo-md-audit',
    environment: process.env['NODE_ENV'] || 'development',
    region: process.env['AWS_REGION'] || 'ca-central-1'
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/audit.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    })
  ]
});

// Compliance logging functions
export const complianceLogger = {
  /**
   * Log user authentication events
   */
  logAuth: (userId: string, action: string, success: boolean, metadata?: any) => {
    auditLogger.info('Authentication event', {
      event_type: 'authentication',
      user_id: userId,
      action,
      success,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log session events
   */
  logSession: (sessionId: string, userId: string, action: string, metadata?: any) => {
    auditLogger.info('Session event', {
      event_type: 'session',
      session_id: sessionId,
      user_id: userId,
      action,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log transcription events (metadata only, no PHI)
   */
  logTranscription: (sessionId: string, action: string, metadata?: any) => {
    auditLogger.info('Transcription event', {
      event_type: 'transcription',
      session_id: sessionId,
      action,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log export events
   */
  logExport: (sessionId: string, userId: string, format: string, metadata?: any) => {
    auditLogger.info('Export event', {
      event_type: 'export',
      session_id: sessionId,
      user_id: userId,
      format,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log data access events
   */
  logDataAccess: (userId: string, resourceType: string, resourceId: string, action: string, metadata?: any) => {
    auditLogger.info('Data access event', {
      event_type: 'data_access',
      user_id: userId,
      resource_type: resourceType,
      resource_id: resourceId,
      action,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log compliance violations
   */
  logViolation: (type: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) => {
    auditLogger.error('Compliance violation', {
      event_type: 'compliance_violation',
      violation_type: type,
      severity,
      timestamp: new Date().toISOString(),
      details: sanitizeMetadata(details)
    });
  }
};

// Performance logging
export const performanceLogger = {
  /**
   * Log API response times
   */
  logApiResponse: (method: string, path: string, statusCode: number, responseTime: number, userId?: string) => {
    logger.info('API response', {
      event_type: 'api_response',
      method,
      path,
      status_code: statusCode,
      response_time_ms: responseTime,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log transcription performance metrics
   */
  logTranscriptionMetrics: (sessionId: string, metrics: {
    latency_ms: number;
    confidence_score: number;
    language_detected: string;
    chunk_size_bytes: number;
  }) => {
    logger.info('Transcription metrics', {
      event_type: 'transcription_metrics',
      session_id: sessionId,
      ...metrics,
      timestamp: new Date().toISOString()
    });
  }
};

// Error logging with context
export const errorLogger = {
  /**
   * Log application errors with context
   */
  logError: (error: Error, context: any = {}) => {
    logger.error('Application error', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context: sanitizeMetadata(context),
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log AWS service errors
   */
  logAwsError: (service: string, operation: string, error: any, context: any = {}) => {
    logger.error('AWS service error', {
      service,
      operation,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode
      },
      context: sanitizeMetadata(context),
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log database errors
   */
  logDatabaseError: (operation: string, error: any, context: any = {}) => {
    logger.error('Database error', {
      operation,
      error: {
        message: error.message,
        code: error.code
      },
      context: sanitizeMetadata(context),
      timestamp: new Date().toISOString()
    });
  }
};

// Security logging
export const securityLogger = {
  /**
   * Log security events
   */
  logSecurityEvent: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) => {
    logger.warn('Security event', {
      event_type: 'security',
      event,
      severity,
      details: sanitizeMetadata(details),
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log rate limiting events
   */
  logRateLimit: (ip: string, endpoint: string, limit: number) => {
    logger.warn('Rate limit exceeded', {
      event_type: 'rate_limit',
      ip_address: ip,
      endpoint,
      limit,
      timestamp: new Date().toISOString()
    });
  }
};

// Utility functions
export const logUtils = {
  /**
   * Create a child logger with additional context
   */
  createChildLogger: (context: any) => {
    return logger.child(context);
  },

  /**
   * Log startup information
   */
  logStartup: (config: any) => {
    logger.info('Application startup', {
      event_type: 'startup',
      config: sanitizeMetadata(config),
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log shutdown information
   */
  logShutdown: (reason: string) => {
    logger.info('Application shutdown', {
      event_type: 'shutdown',
      reason,
      timestamp: new Date().toISOString()
    });
  }
};

export { logger };
