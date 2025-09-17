/**
 * Production-optimized logging utility
 * Reduces excessive logging in production while maintaining essential monitoring
 */

import { ENV } from '../config/env.js';

export class ProductionLogger {
  private static instance: ProductionLogger;
  private logLevel: 'debug' | 'info' | 'warn' | 'error';
  private isDevelopment: boolean;
  
  private constructor() {
    this.isDevelopment = ENV.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? 'debug' : 'info';
  }
  
  static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }
  
  // Performance logging (always enabled for monitoring)
  logPerformance(metric: string, value: number, threshold?: number): void {
    if (threshold && value > threshold) {
      console.warn(`[PERF] ${metric}: ${value} (threshold: ${threshold})`);
    } else if (this.isDevelopment) {
      console.log(`[PERF] ${metric}: ${value}`);
    }
  }
  
  // Memory logging (always enabled for monitoring)
  logMemory(operation: string, usage: { usedMB: number; totalMB: number; usageRatio: number }): void {
    if (usage.usageRatio > 0.8) {
      console.warn(`[MEMORY] ${operation}: ${usage.usedMB.toFixed(2)}MB / ${usage.totalMB.toFixed(2)}MB (${(usage.usageRatio * 100).toFixed(1)}%)`);
    } else if (this.isDevelopment) {
      console.log(`[MEMORY] ${operation}: ${usage.usedMB.toFixed(2)}MB / ${usage.totalMB.toFixed(2)}MB (${(usage.usageRatio * 100).toFixed(1)}%)`);
    }
  }
  
  // Speaker correction logging (development only)
  logSpeakerCorrection(text: string, originalSpeaker: string, correctedSpeaker: string): void {
    if (this.isDevelopment && ENV.SPEAKER_CORRECTION_LOGGING) {
      console.log(`[SPEAKER] "${text.substring(0, 50)}..." ${originalSpeaker} → ${correctedSpeaker}`);
    }
  }
  
  // Conversation flow logging (development only)
  logConversationFlow(operation: string, details: any): void {
    if (this.isDevelopment && ENV.CONVERSATION_FLOW_LOGGING) {
      console.log(`[FLOW] ${operation}:`, details);
    }
  }
  
  // Error logging (always enabled)
  logError(error: string, context?: any): void {
    console.error(`[ERROR] ${error}`, context || '');
  }
  
  // Warning logging (always enabled)
  logWarning(warning: string, context?: any): void {
    console.warn(`[WARN] ${warning}`, context || '');
  }
  
  // Info logging (development only)
  logInfo(message: string, context?: any): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context || '');
    }
  }
  
  // Debug logging (development only)
  logDebug(message: string, context?: any): void {
    if (this.isDevelopment && this.logLevel === 'debug') {
      console.log(`[DEBUG] ${message}`, context || '');
    }
  }
  
  // Segment processing logging (development only)
  logSegmentProcessing(operation: string, segmentHash: string, details?: any): void {
    if (this.isDevelopment) {
      console.log(`[SEGMENT] ${operation}: ${segmentHash.substring(0, 8)}...`, details || '');
    }
  }
  
  // Memory cleanup logging (always enabled for monitoring)
  logMemoryCleanup(operation: string, before: number, after: number): void {
    console.log(`[CLEANUP] ${operation}: ${before} → ${after} segments`);
  }
  
  // Performance threshold logging (always enabled)
  logPerformanceThreshold(metric: string, value: number, threshold: number, status: string): void {
    const emoji = status === 'healthy' ? '✅' : status === 'warning' ? '⚠️' : '🚨';
    console.log(`${emoji} [THRESHOLD] ${metric}: ${value} (threshold: ${threshold}) - ${status.toUpperCase()}`);
  }
}

// Export singleton instance
export const productionLogger = ProductionLogger.getInstance();
