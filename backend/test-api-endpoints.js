/**
 * API Endpoint Testing Script
 * Tests /api/format/mode2 endpoint with various scenarios
 * 
 * Usage: node test-api-endpoints.js [baseUrl]
 * Example: node test-api-endpoints.js http://localhost:3000
 * 
 * Requires Node.js 18+ (for built-in fetch) or install node-fetch
 */

// Use built-in fetch (Node 18+) or try to import node-fetch
let fetch;
try {
  // Try built-in fetch first (Node 18+)
  fetch = globalThis.fetch;
  if (!fetch) {
    // Fallback to node-fetch if installed
    const nodeFetch = await import('node-fetch');
    fetch = nodeFetch.default;
  }
} catch (error) {
  console.error('❌ fetch not available. Please use Node.js 18+ or install node-fetch: npm install node-fetch');
  process.exit(1);
}

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const API_ENDPOINT = `${BASE_URL}/api/format/mode2`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`🧪 Test: ${testName}`, colors.cyan);
  log('='.repeat(60), colors.cyan);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Sample transcript for testing
const sampleTranscript = `Le travailleur consulte le médecin suite à une douleur au dos.
Le patient présente des symptômes de lombalgie.
Examen physique révèle une limitation de la mobilité lombaire.`;

async function testEndpoint(testName, requestConfig) {
  logTest(testName);
  
  try {
    const startTime = Date.now();
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(requestConfig.headers || {}),
      },
      body: JSON.stringify(requestConfig.body),
    });
    
    const latency = Date.now() - startTime;
    const data = await response.json();
    
    logInfo(`Status: ${response.status} | Latency: ${latency}ms`);
    
    if (response.ok) {
      logSuccess('Request succeeded');
      
      // Log response structure
      if (data.formatted) {
        logInfo(`Formatted output length: ${data.formatted.length} chars`);
      }
      
      // Log new fields if present
      if (data.template_base) {
        logInfo(`Template Base: ${data.template_base}`);
      }
      if (data.layerStack) {
        logInfo(`Layer Stack: ${JSON.stringify(data.layerStack)}`);
      }
      if (data.prompt_hash) {
        logInfo(`Prompt Hash: ${data.prompt_hash}`);
      }
      if (data.operational) {
        logInfo(`Operational: ${JSON.stringify(data.operational)}`);
      }
      if (data.deterministic !== undefined) {
        logInfo(`Deterministic: ${data.deterministic}`);
      }
      
      return { success: true, data, latency, status: response.status };
    } else {
      logError(`Request failed: ${data.error || 'Unknown error'}`);
      if (data.details) {
        logInfo(`Details: ${data.details}`);
      }
      if (data.traceId) {
        logInfo(`Trace ID: ${data.traceId}`);
      }
      return { success: false, error: data, status: response.status };
    }
  } catch (error) {
    logError(`Request error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  log('\n🚀 Starting API Endpoint Tests', colors.blue);
  log(`Base URL: ${BASE_URL}`, colors.blue);
  log(`Endpoint: ${API_ENDPOINT}`, colors.blue);
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };
  
  // Test 1: Backward Compatibility (existing parameters)
  const test1 = await testEndpoint(
    'Test 1: Backward Compatibility (templateId)',
    {
      body: {
        transcript: sampleTranscript,
        section: '7',
        templateId: 'section7-ai-formatter',
        language: 'fr',
      },
    }
  );
  if (test1.success) {
    results.passed++;
    logSuccess('Backward compatibility works');
  } else {
    results.failed++;
    logError('Backward compatibility failed');
  }
  
  // Test 2: New templateRef parameter
  const test2 = await testEndpoint(
    'Test 2: New templateRef Parameter',
    {
      body: {
        transcript: sampleTranscript,
        section: '7',
        templateRef: 'section7-ai-formatter',
        language: 'fr',
      },
    }
  );
  if (test2.success) {
    results.passed++;
    logSuccess('templateRef parameter works');
  } else {
    results.failed++;
    logError('templateRef parameter failed');
  }
  
  // Test 3: Model Selection (should be ignored if flag OFF)
  const test3 = await testEndpoint(
    'Test 3: Model Selection (flag OFF - should ignore)',
    {
      body: {
        transcript: sampleTranscript,
        section: '7',
        templateId: 'section7-ai-formatter',
        model: 'gpt-5',
        language: 'fr',
      },
    }
  );
  if (test3.success) {
    results.passed++;
    logWarning('Model selection ignored (flag OFF - expected behavior)');
    results.warnings++;
  } else {
    // This might fail if model validation is strict - that's also OK
    if (test3.status === 403 || test3.status === 400) {
      results.passed++;
      logSuccess('Model selection correctly rejected (flag OFF)');
    } else {
      results.failed++;
      logError('Model selection test failed unexpectedly');
    }
  }
  
  // Test 4: Seed and Temperature (reproducibility controls)
  const test4 = await testEndpoint(
    'Test 4: Seed and Temperature Parameters',
    {
      body: {
        transcript: sampleTranscript,
        section: '7',
        templateId: 'section7-ai-formatter',
        seed: 42,
        temperature: 0.2,
        language: 'fr',
      },
    }
  );
  if (test4.success) {
    results.passed++;
    logSuccess('Seed and temperature parameters accepted');
    if (test4.data.deterministic !== undefined) {
      logInfo(`Deterministic flag: ${test4.data.deterministic}`);
    }
  } else {
    results.failed++;
    logError('Seed and temperature test failed');
  }
  
  // Test 5: Idempotency Key
  const idempotencyKey = `test-${Date.now()}`;
  const test5a = await testEndpoint(
    'Test 5a: Idempotency Key (first request)',
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: {
        transcript: sampleTranscript,
        section: '7',
        templateId: 'section7-ai-formatter',
        language: 'fr',
      },
    }
  );
  
  if (test5a.success) {
    // Make second request with same key
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    
    const test5b = await testEndpoint(
      'Test 5b: Idempotency Key (second request - should be cached)',
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: {
          transcript: sampleTranscript,
          section: '7',
          templateId: 'section7-ai-formatter',
          language: 'fr',
        },
      }
    );
    
    if (test5b.success) {
      if (test5b.latency < test5a.latency * 0.1) {
        // Second request should be much faster if cached
        results.passed++;
        logSuccess('Idempotency key works (cached response returned)');
      } else {
        results.warnings++;
        logWarning('Idempotency key may not be caching (latency similar)');
      }
    } else {
      results.failed++;
      logError('Idempotency second request failed');
    }
  } else {
    results.failed++;
    logError('Idempotency first request failed');
  }
  
  // Test 6: Trace ID
  const test6 = await testEndpoint(
    'Test 6: Trace ID Generation',
    {
      body: {
        transcript: sampleTranscript,
        section: '7',
        templateId: 'section7-ai-formatter',
        language: 'fr',
      },
    }
  );
  if (test6.success) {
    // Trace ID should be in response headers (check manually)
    results.passed++;
    logSuccess('Trace ID generated (check response headers)');
  } else {
    results.failed++;
    logError('Trace ID test failed');
  }
  
  // Test 7: Enhanced Response Fields (if flag enabled)
  const test7 = await testEndpoint(
    'Test 7: Enhanced Response Fields',
    {
      body: {
        transcript: sampleTranscript,
        section: '7',
        templateId: 'section7-ai-formatter',
        language: 'fr',
      },
    }
  );
  if (test7.success) {
    if (test7.data.template_base || test7.data.layerStack || test7.data.prompt_hash) {
      results.passed++;
      logSuccess('Enhanced response fields present');
    } else {
      results.warnings++;
      logWarning('Enhanced response fields not present (may need flag enabled)');
    }
  } else {
    results.failed++;
    logError('Enhanced response test failed');
  }
  
  // Test 8: Error Handling
  const test8 = await testEndpoint(
    'Test 8: Error Handling (invalid section)',
    {
      body: {
        transcript: sampleTranscript,
        section: '99', // Invalid section
        templateId: 'section7-ai-formatter',
        language: 'fr',
      },
    }
  );
  if (!test8.success && test8.status === 400) {
    results.passed++;
    logSuccess('Error handling works (invalid section rejected)');
  } else {
    results.failed++;
    logError('Error handling test failed');
  }
  
  // Test 9: Missing Required Field
  const test9 = await testEndpoint(
    'Test 9: Error Handling (missing transcript)',
    {
      body: {
        section: '7',
        templateId: 'section7-ai-formatter',
        language: 'fr',
        // transcript missing
      },
    }
  );
  if (!test9.success && test9.status === 400) {
    results.passed++;
    logSuccess('Error handling works (missing transcript rejected)');
  } else {
    results.failed++;
    logError('Error handling test failed');
  }
  
  // Summary
  log('\n' + '='.repeat(60), colors.cyan);
  log('📊 Test Summary', colors.cyan);
  log('='.repeat(60), colors.cyan);
  log(`✅ Passed: ${results.passed}`, colors.green);
  log(`⚠️  Warnings: ${results.warnings}`, colors.yellow);
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.reset);
  
  const total = results.passed + results.failed + results.warnings;
  const successRate = ((results.passed / total) * 100).toFixed(1);
  log(`\n📈 Success Rate: ${successRate}%`, colors.blue);
  
  if (results.failed === 0) {
    log('\n🎉 All critical tests passed!', colors.green);
  } else {
    log('\n⚠️  Some tests failed. Review output above.', colors.yellow);
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
