/**
 * Test script for IntelligentMemoryManager
 * Verifies segment deduplication, memory cleanup, and performance monitoring
 */

// Mock performance.memory for testing
global.performance = {
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB
  }
};

// Simple hash function (copied from the implementation)
function createHash(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// Mock IntelligentMemoryManager class
class IntelligentMemoryManager {
  constructor(cleanupInterval = 60000) {
    this.cleanupInterval = cleanupInterval;
    this.processedSegments = new Set();
    this.lastCleanup = Date.now();
    this.memoryThreshold = 0.8; // 80% memory usage threshold
  }
  
  createSegmentHash(transcriptionData) {
    const content = `${transcriptionData.text}_${transcriptionData.speaker}_${transcriptionData.startTime}_${transcriptionData.endTime}`;
    return createHash(content);
  }
  
  shouldProcessSegment(hash) {
    if (this.processedSegments.has(hash)) {
      console.log(`Skipping duplicate segment processing: ${hash.substring(0, 8)}...`);
      return false;
    }
    this.processedSegments.add(hash);
    return true;
  }
  
  cleanupOldSegments() {
    const now = Date.now();
    
    if (now - this.lastCleanup < this.cleanupInterval) {
      return;
    }
    
    if (this.processedSegments.size > 1000) {
      const recentHashes = Array.from(this.processedSegments).slice(-500);
      this.processedSegments = new Set(recentHashes);
      console.log(`Memory cleanup: reduced processed segments from 1000+ to ${recentHashes.length}`);
    }
    
    this.lastCleanup = now;
  }
  
  checkMemoryPressure() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memoryInfo = performance.memory;
      const usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
      const totalMB = memoryInfo.totalJSHeapSize / (1024 * 1024);
      const usageRatio = usedMB / totalMB;
      
      if (usageRatio > this.memoryThreshold) {
        console.warn(`High memory usage detected: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB (${(usageRatio * 100).toFixed(1)}%)`);
        this.cleanupOldSegments();
        return true;
      }
    }
    return false;
  }
  
  getMemoryStats() {
    let usedMB = 0;
    let totalMB = 0;
    let usageRatio = 0;
    
    if (typeof performance !== 'undefined' && performance.memory) {
      const memoryInfo = performance.memory;
      usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
      totalMB = memoryInfo.totalJSHeapSize / (1024 * 1024);
      usageRatio = usedMB / totalMB;
    }
    
    return {
      usedMB: Math.round(usedMB * 100) / 100,
      totalMB: Math.round(totalMB * 100) / 100,
      usageRatio: Math.round(usageRatio * 1000) / 1000,
      segmentCount: this.processedSegments.size
    };
  }
}

// Test cases
function runTests() {
  console.log('🧪 Testing IntelligentMemoryManager...\n');
  
  const manager = new IntelligentMemoryManager(1000); // 1 second cleanup interval for testing
  
  // Test 1: Segment deduplication
  console.log('Test 1: Segment Deduplication');
  const segment1 = {
    text: "Hello, how are you?",
    speaker: "doctor",
    startTime: 1000,
    endTime: 2000
  };
  
  const hash1 = manager.createSegmentHash(segment1);
  console.log(`Hash: ${hash1}`);
  
  // First processing should succeed
  const shouldProcess1 = manager.shouldProcessSegment(hash1);
  console.log(`First processing: ${shouldProcess1} (expected: true)`);
  
  // Second processing should be skipped
  const shouldProcess2 = manager.shouldProcessSegment(hash1);
  console.log(`Duplicate processing: ${shouldProcess2} (expected: false)`);
  
  // Test 2: Memory statistics
  console.log('\nTest 2: Memory Statistics');
  const stats = manager.getMemoryStats();
  console.log(`Memory stats:`, stats);
  console.log(`Usage ratio: ${(stats.usageRatio * 100).toFixed(1)}% (expected: 50%)`);
  
  // Test 3: Memory pressure detection
  console.log('\nTest 3: Memory Pressure Detection');
  const hasPressure = manager.checkMemoryPressure();
  console.log(`Memory pressure detected: ${hasPressure} (expected: false - 50% < 80%)`);
  
  // Test 4: Simulate high memory usage
  console.log('\nTest 4: High Memory Usage Simulation');
  global.performance.memory.usedJSHeapSize = 90 * 1024 * 1024; // 90MB (90% usage)
  const hasHighPressure = manager.checkMemoryPressure();
  console.log(`High memory pressure detected: ${hasHighPressure} (expected: true - 90% > 80%)`);
  
  // Test 5: Segment cleanup
  console.log('\nTest 5: Segment Cleanup');
  // Add many segments to trigger cleanup
  for (let i = 0; i < 1200; i++) {
    const segment = {
      text: `Test segment ${i}`,
      speaker: "patient",
      startTime: i * 1000,
      endTime: (i + 1) * 1000
    };
    const hash = manager.createSegmentHash(segment);
    manager.shouldProcessSegment(hash);
  }
  
  console.log(`Segments before cleanup: ${manager.processedSegments.size}`);
  manager.cleanupOldSegments();
  console.log(`Segments after cleanup: ${manager.processedSegments.size} (expected: 500)`);
  
  // Test 6: Hash uniqueness
  console.log('\nTest 6: Hash Uniqueness');
  const segmentA = { text: "Hello", speaker: "doctor", startTime: 1000, endTime: 2000 };
  const segmentB = { text: "Hello", speaker: "patient", startTime: 1000, endTime: 2000 };
  const segmentC = { text: "Hello", speaker: "doctor", startTime: 2000, endTime: 3000 };
  
  const hashA = manager.createSegmentHash(segmentA);
  const hashB = manager.createSegmentHash(segmentB);
  const hashC = manager.createSegmentHash(segmentC);
  
  console.log(`Hash A: ${hashA}`);
  console.log(`Hash B: ${hashB}`);
  console.log(`Hash C: ${hashC}`);
  console.log(`All hashes unique: ${hashA !== hashB && hashB !== hashC && hashA !== hashC} (expected: true)`);
  
  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests();
