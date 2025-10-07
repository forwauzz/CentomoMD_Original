import { Request, Response, NextFunction } from 'express';
import { performanceLogger, logger } from '@/utils/logger.js';

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    // Log performance metrics
    performanceLogger.logApiResponse(
      req.method,
      req.path,
      res.statusCode,
      responseTime,
      req.user?.id
    );

    // Add response time to headers
    res.setHeader('X-Response-Time', `${responseTime}ms`);

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Memory usage monitoring
export const memoryUsageMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startMemory = process.memoryUsage();
  
  res.on('finish', () => {
    const endMemory = process.memoryUsage();
    const memoryDiff = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };

    // Log significant memory usage
    if (Math.abs(memoryDiff.heapUsed) > 1024 * 1024) { // 1MB threshold
      logger.info('Significant memory usage detected', {
        endpoint: req.path,
        method: req.method,
        userId: req.user?.id,
        memoryDiff,
        startMemory,
        endMemory
      });
    }
  });

  next();
};

// Request size monitoring
export const requestSizeMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    logger.warn('Large request detected', {
      endpoint: req.path,
      method: req.method,
      userId: req.user?.id,
      contentLength,
      maxSize,
      ip: req.ip
    });
  }

  next();
};

// Response time threshold monitoring
export const responseTimeThresholdMiddleware = (threshold: number = 5000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      if (responseTime > threshold) {
        logger.warn('Slow response detected', {
          endpoint: req.path,
          method: req.method,
          userId: req.user?.id,
          responseTime,
          threshold,
          ip: req.ip
        });
      }
    });

    next();
  };
};

// Database query monitoring
export const databaseQueryMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  let queryCount = 0;

  // Override console.log to capture database queries (if using console.log for queries)
  const originalLog = console.log;
  console.log = function(...args: any[]) {
    const message = args.join(' ');
    if (message.includes('SELECT') || message.includes('INSERT') || 
        message.includes('UPDATE') || message.includes('DELETE')) {
      queryCount++;
    }
    originalLog.apply(console, args);
  };

  res.on('finish', () => {
    const queryTime = Date.now() - startTime;
    
    if (queryCount > 0) {
      logger.info('Database query metrics', {
        endpoint: req.path,
        method: req.method,
        userId: req.user?.id,
        queryCount,
        queryTime,
        averageQueryTime: queryTime / queryCount
      });
    }

    // Restore original console.log
    console.log = originalLog;
  });

  next();
};

// Error rate monitoring
export const errorRateMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    if (res.statusCode >= 400) {
      logger.warn('Error response detected', {
        endpoint: req.path,
        method: req.method,
        userId: req.user?.id,
        statusCode: res.statusCode,
        responseTime,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
  });

  next();
};

// Combined performance middleware
export const comprehensivePerformanceMiddleware = [
  performanceMiddleware,
  memoryUsageMiddleware,
  requestSizeMiddleware,
  responseTimeThresholdMiddleware(5000), // 5 second threshold
  databaseQueryMiddleware,
  errorRateMiddleware
];
