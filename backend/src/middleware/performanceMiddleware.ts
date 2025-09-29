import { Request, Response, NextFunction } from 'express';
import { performanceLogger, logger } from '../utils/logger.js';
import { productionLogger } from '../utils/productionLogger.js';

// Real-time performance monitoring with intelligent thresholds
class RealTimePerformanceMonitor {
  private metrics: {
    transcriptionLatency: number[];
    speakerAccuracy: number[];
    memoryUsage: number[];
    processingTime: number[];
    errorRate: number;
    totalRequests: number;
    // Orthopedic-specific metrics
    orthopedicPhaseAccuracy: number[];
    medicalTermRecognition: number[];
    bodyPartExtraction: number[];
    painLevelAccuracy: number[];
  };
  private thresholds: {
    maxLatency: number;
    maxMemoryUsage: number;
    maxProcessingTime: number;
    maxErrorRate: number;
  };
  
  constructor() {
    this.metrics = {
      transcriptionLatency: [],
      speakerAccuracy: [],
      memoryUsage: [],
      processingTime: [],
      errorRate: 0,
      totalRequests: 0,
      // Orthopedic-specific metrics
      orthopedicPhaseAccuracy: [],
      medicalTermRecognition: [],
      bodyPartExtraction: [],
      painLevelAccuracy: []
    };
    this.thresholds = {
      maxLatency: 500, // 500ms
      maxMemoryUsage: 0.8, // 80%
      maxProcessingTime: 2000, // 2 seconds
      maxErrorRate: 0.05 // 5%
    };
  }
  
  // Record transcription latency
  recordTranscriptionLatency(latency: number): void {
    this.metrics.transcriptionLatency.push(latency);
    if (this.metrics.transcriptionLatency.length > 100) {
      this.metrics.transcriptionLatency = this.metrics.transcriptionLatency.slice(-50);
    }
  }
  
  // Record speaker accuracy (0-1 scale)
  recordSpeakerAccuracy(accuracy: number): void {
    this.metrics.speakerAccuracy.push(accuracy);
    if (this.metrics.speakerAccuracy.length > 100) {
      this.metrics.speakerAccuracy = this.metrics.speakerAccuracy.slice(-50);
    }
  }
  
  // Record memory usage
  recordMemoryUsage(usageRatio: number): void {
    this.metrics.memoryUsage.push(usageRatio);
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-50);
    }
  }
  
  // Record processing time
  recordProcessingTime(time: number): void {
    this.metrics.processingTime.push(time);
    if (this.metrics.processingTime.length > 100) {
      this.metrics.processingTime = this.metrics.processingTime.slice(-50);
    }
  }
  
  // Record request (success or error)
  recordRequest(isError: boolean = false): void {
    this.metrics.totalRequests++;
    if (isError) {
      this.metrics.errorRate = (this.metrics.errorRate * (this.metrics.totalRequests - 1) + 1) / this.metrics.totalRequests;
    } else {
      this.metrics.errorRate = (this.metrics.errorRate * (this.metrics.totalRequests - 1)) / this.metrics.totalRequests;
    }
  }
  
  // Record orthopedic phase accuracy (0-1 scale)
  recordOrthopedicPhaseAccuracy(accuracy: number): void {
    this.metrics.orthopedicPhaseAccuracy.push(accuracy);
    if (this.metrics.orthopedicPhaseAccuracy.length > 50) {
      this.metrics.orthopedicPhaseAccuracy = this.metrics.orthopedicPhaseAccuracy.slice(-25);
    }
  }
  
  // Record medical term recognition accuracy (0-1 scale)
  recordMedicalTermRecognition(accuracy: number): void {
    this.metrics.medicalTermRecognition.push(accuracy);
    if (this.metrics.medicalTermRecognition.length > 50) {
      this.metrics.medicalTermRecognition = this.metrics.medicalTermRecognition.slice(-25);
    }
  }
  
  // Record body part extraction accuracy (0-1 scale)
  recordBodyPartExtraction(accuracy: number): void {
    this.metrics.bodyPartExtraction.push(accuracy);
    if (this.metrics.bodyPartExtraction.length > 50) {
      this.metrics.bodyPartExtraction = this.metrics.bodyPartExtraction.slice(-25);
    }
  }
  
  // Record pain level accuracy (0-1 scale)
  recordPainLevelAccuracy(accuracy: number): void {
    this.metrics.painLevelAccuracy.push(accuracy);
    if (this.metrics.painLevelAccuracy.length > 50) {
      this.metrics.painLevelAccuracy = this.metrics.painLevelAccuracy.slice(-25);
    }
  }
  
  // Get average latency
  getAverageLatency(): number {
    if (this.metrics.transcriptionLatency.length === 0) return 0;
    return this.metrics.transcriptionLatency.reduce((a, b) => a + b, 0) / this.metrics.transcriptionLatency.length;
  }
  
  // Get average speaker accuracy
  getAverageSpeakerAccuracy(): number {
    if (this.metrics.speakerAccuracy.length === 0) return 0;
    return this.metrics.speakerAccuracy.reduce((a, b) => a + b, 0) / this.metrics.speakerAccuracy.length;
  }
  
  // Get current memory usage
  getMemoryUsage(): number {
    const memUsage = process.memoryUsage();
    return memUsage.heapUsed / memUsage.heapTotal;
  }
  
  // Get average orthopedic phase accuracy
  getAverageOrthopedicPhaseAccuracy(): number {
    if (this.metrics.orthopedicPhaseAccuracy.length === 0) return 0;
    return this.metrics.orthopedicPhaseAccuracy.reduce((a, b) => a + b, 0) / this.metrics.orthopedicPhaseAccuracy.length;
  }
  
  // Get average medical term recognition accuracy
  getAverageMedicalTermRecognition(): number {
    if (this.metrics.medicalTermRecognition.length === 0) return 0;
    return this.metrics.medicalTermRecognition.reduce((a, b) => a + b, 0) / this.metrics.medicalTermRecognition.length;
  }
  
  // Get average body part extraction accuracy
  getAverageBodyPartExtraction(): number {
    if (this.metrics.bodyPartExtraction.length === 0) return 0;
    return this.metrics.bodyPartExtraction.reduce((a, b) => a + b, 0) / this.metrics.bodyPartExtraction.length;
  }
  
  // Get average pain level accuracy
  getAveragePainLevelAccuracy(): number {
    if (this.metrics.painLevelAccuracy.length === 0) return 0;
    return this.metrics.painLevelAccuracy.reduce((a, b) => a + b, 0) / this.metrics.painLevelAccuracy.length;
  }
  
  // Check performance thresholds
  checkPerformanceThresholds(): { status: string; issues: string[]; metrics: any } {
    const issues: string[] = [];
    const avgLatency = this.getAverageLatency();
    const avgAccuracy = this.getAverageSpeakerAccuracy();
    const memoryUsage = this.getMemoryUsage();
    const avgProcessingTime = this.metrics.processingTime.length > 0 
      ? this.metrics.processingTime.reduce((a, b) => a + b, 0) / this.metrics.processingTime.length 
      : 0;
    
    // Check thresholds and log performance issues
    if (avgLatency > this.thresholds.maxLatency) {
      issues.push(`High latency: ${avgLatency.toFixed(0)}ms > ${this.thresholds.maxLatency}ms`);
      productionLogger.logPerformanceThreshold('Latency', avgLatency, this.thresholds.maxLatency, 'warning');
    }
    if (memoryUsage > this.thresholds.maxMemoryUsage) {
      issues.push(`High memory usage: ${(memoryUsage * 100).toFixed(1)}% > ${(this.thresholds.maxMemoryUsage * 100)}%`);
      productionLogger.logPerformanceThreshold('Memory Usage', memoryUsage * 100, this.thresholds.maxMemoryUsage * 100, 'critical');
    }
    if (avgProcessingTime > this.thresholds.maxProcessingTime) {
      issues.push(`High processing time: ${avgProcessingTime.toFixed(0)}ms > ${this.thresholds.maxProcessingTime}ms`);
      productionLogger.logPerformanceThreshold('Processing Time', avgProcessingTime, this.thresholds.maxProcessingTime, 'warning');
    }
    if (this.metrics.errorRate > this.thresholds.maxErrorRate) {
      issues.push(`High error rate: ${(this.metrics.errorRate * 100).toFixed(1)}% > ${(this.thresholds.maxErrorRate * 100)}%`);
      productionLogger.logPerformanceThreshold('Error Rate', this.metrics.errorRate * 100, this.thresholds.maxErrorRate * 100, 'critical');
    }
    if (avgAccuracy < 0.7) {
      issues.push(`Low speaker accuracy: ${(avgAccuracy * 100).toFixed(1)}% < 70%`);
      productionLogger.logPerformanceThreshold('Speaker Accuracy', avgAccuracy * 100, 70, 'warning');
    }
    
    return {
      status: issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'warning' : 'critical',
      issues,
      metrics: {
        avgLatency: Math.round(avgLatency),
        avgAccuracy: Math.round(avgAccuracy * 100) / 100,
        memoryUsage: Math.round(memoryUsage * 1000) / 1000,
        avgProcessingTime: Math.round(avgProcessingTime),
        errorRate: Math.round(this.metrics.errorRate * 1000) / 1000,
        totalRequests: this.metrics.totalRequests,
        // Orthopedic-specific metrics
        orthopedicPhaseAccuracy: Math.round(this.getAverageOrthopedicPhaseAccuracy() * 100) / 100,
        medicalTermRecognition: Math.round(this.getAverageMedicalTermRecognition() * 100) / 100,
        bodyPartExtraction: Math.round(this.getAverageBodyPartExtraction() * 100) / 100,
        painLevelAccuracy: Math.round(this.getAveragePainLevelAccuracy() * 100) / 100
      }
    };
  }
  
  // Get performance summary
  getPerformanceSummary(): any {
    const thresholdCheck = this.checkPerformanceThresholds();
    return {
      ...thresholdCheck,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}

// Global performance monitor instance
const performanceMonitor = new RealTimePerformanceMonitor();

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    // Record metrics in performance monitor
    performanceMonitor.recordProcessingTime(responseTime);
    performanceMonitor.recordRequest(res.statusCode >= 400);
    
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

    // Record memory usage in performance monitor
    const memoryUsageRatio = endMemory.heapUsed / endMemory.heapTotal;
    performanceMonitor.recordMemoryUsage(memoryUsageRatio);

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

// Export performance monitor for use in other modules
export { performanceMonitor };

// Performance metrics endpoint
export const getPerformanceMetrics = (_req: Request, res: Response) => {
  try {
    const summary = performanceMonitor.getPerformanceSummary();
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error getting performance metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics'
    });
  }
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
