import { Request, Response, NextFunction } from 'express';
import { logger, errorLogger } from '@/utils/logger.js';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
  details?: any;
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends CustomError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export const errorHandler = (
  error: AppError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = null;

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  }
  // Handle custom application errors
  else if (error instanceof CustomError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    
    if (error instanceof ValidationError) {
      details = error.details;
    }
  }
  // Handle database errors
  else if (error.name === 'PostgresError') {
    const pgError = error as any;
    
    switch (pgError.code) {
      case '23505': // unique_violation
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'Resource already exists';
        break;
      case '23503': // foreign_key_violation
        statusCode = 400;
        code = 'FOREIGN_KEY_VIOLATION';
        message = 'Referenced resource does not exist';
        break;
      case '23502': // not_null_violation
        statusCode = 400;
        code = 'NULL_VIOLATION';
        message = 'Required field is missing';
        break;
      case '42P01': // undefined_table
        statusCode = 500;
        code = 'DATABASE_ERROR';
        message = 'Database configuration error';
        break;
      default:
        statusCode = 500;
        code = 'DATABASE_ERROR';
        message = 'Database operation failed';
    }
  }
  // Handle AWS service errors
  else if (error.name === 'ServiceError' || error.name === 'ClientError') {
    const awsError = error as any;
    
    switch (awsError.code) {
      case 'ThrottlingException':
        statusCode = 429;
        code = 'AWS_THROTTLING';
        message = 'AWS service is throttling requests';
        break;
      case 'AccessDeniedException':
        statusCode = 403;
        code = 'AWS_ACCESS_DENIED';
        message = 'AWS service access denied';
        break;
      case 'ResourceNotFoundException':
        statusCode = 404;
        code = 'AWS_RESOURCE_NOT_FOUND';
        message = 'AWS resource not found';
        break;
      case 'InvalidParameterException':
        statusCode = 400;
        code = 'AWS_INVALID_PARAMETER';
        message = 'Invalid AWS service parameter';
        break;
      default:
        statusCode = 500;
        code = 'AWS_SERVICE_ERROR';
        message = 'AWS service error';
    }
  }
  // Handle network errors
  else if (error.name === 'NetworkError' || error.message.includes('network')) {
    statusCode = 503;
    code = 'NETWORK_ERROR';
    message = 'Network connectivity issue';
  }
  // Handle timeout errors
  else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    statusCode = 408;
    code = 'TIMEOUT_ERROR';
    message = 'Request timeout';
  }
  // Handle other known errors
  else if (error.message) {
    message = error.message;
    
    // Try to extract status code from error message
    const statusMatch = error.message.match(/status[:\s]*(\d+)/i);
    if (statusMatch) {
      statusCode = parseInt(statusMatch[1]);
    }
  }

  // Log error with context
  const errorContext = {
    userId: req.user?.id,
    sessionId: req.params.sessionId,
    endpoint: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id'],
    statusCode,
    code,
    details
  };

  if (statusCode >= 500) {
    errorLogger.logError(error, errorContext);
  } else {
    logger.warn('Client error', {
      ...errorContext,
      error: error.message,
      stack: error.stack
    });
  }

  // Don't send error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse: any = {
    error: code,
    message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Include details in development or for validation errors
  if (isDevelopment || details || statusCode === 400) {
    errorResponse.details = details;
  }

  // Include stack trace only in development
  if (isDevelopment && error.stack) {
    errorResponse.stack = error.stack;
  }

  // Include request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id'];
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response) => {
  const error = new NotFoundError('Endpoint');
  errorHandler(error, req, res, () => {});
};

// Global error handlers for uncaught exceptions
export const setupGlobalErrorHandlers = () => {
  process.on('uncaughtException', (error: Error) => {
    errorLogger.logError(error, {
      type: 'uncaught_exception',
      timestamp: new Date().toISOString()
    });
    
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    
    errorLogger.logError(error, {
      type: 'unhandled_rejection',
      promise: promise.toString(),
      timestamp: new Date().toISOString()
    });
    
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
};
