#!/usr/bin/env node

/**
 * Debug test for case creation API
 * Tests the case creation endpoint step by step
 */

import http from 'http';

console.log('🔍 Debugging Case Creation API...\n');

// Test 1: Check if server is running
console.log('1️⃣ Testing server connectivity...');
const testServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/healthz', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Server is running');
        resolve(true);
      } else {
        console.log('❌ Server returned status:', res.statusCode);
        reject(new Error(`Server returned ${res.statusCode}`));
      }
    });
    
    req.on('error', (err) => {
      console.log('❌ Server connection failed:', err.message);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Server connection timeout');
      reject(new Error('Connection timeout'));
    });
  });
};

// Test 2: Check database test endpoint
console.log('\n2️⃣ Testing database connectivity...');
const testDatabase = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/api/cases/test', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log('✅ Database connection working');
            console.log('📊 Database info:', {
              caseCount: result.data.caseCount,
              tableExists: result.data.tableExists,
              columns: result.data.columns?.length || 0
            });
            resolve(result.data);
          } else {
            console.log('❌ Database test failed:', result.error);
            reject(new Error(result.error));
          }
        } catch (err) {
          console.log('❌ Failed to parse database response:', err.message);
          reject(err);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Database test request failed:', err.message);
      reject(err);
    });
  });
};

// Test 3: Try case creation with minimal data
console.log('\n3️⃣ Testing case creation...');
const testCaseCreation = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({});
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/cases',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log('✅ Case creation successful');
            console.log('📋 Created case:', {
              id: result.data.id,
              hasDraft: !!result.data.draft,
              draftKeys: result.data.draft ? Object.keys(result.data.draft) : []
            });
            resolve(result.data);
          } else {
            console.log('❌ Case creation failed:', result.error);
            console.log('📋 Full response:', result);
            reject(new Error(result.error));
          }
        } catch (err) {
          console.log('❌ Failed to parse case creation response:', err.message);
          console.log('📋 Raw response:', data);
          reject(err);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Case creation request failed:', err.message);
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
};

// Test 4: Check recent cases
console.log('\n4️⃣ Testing recent cases retrieval...');
const testRecentCases = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/api/cases?limit=5', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log('✅ Recent cases retrieval successful');
            console.log('📋 Found cases:', result.data.length);
            if (result.data.length > 0) {
              console.log('📋 First case:', {
                id: result.data[0].id,
                hasPatientInfo: !!result.data[0].patient_info,
                hasSections: !!result.data[0].sections,
                status: result.data[0].status
              });
            }
            resolve(result.data);
          } else {
            console.log('❌ Recent cases retrieval failed:', result.error);
            reject(new Error(result.error));
          }
        } catch (err) {
          console.log('❌ Failed to parse recent cases response:', err.message);
          reject(err);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Recent cases request failed:', err.message);
      reject(err);
    });
  });
};

// Run all tests
async function runTests() {
  try {
    await testServer();
    const dbInfo = await testDatabase();
    const newCase = await testCaseCreation();
    const recentCases = await testRecentCases();
    
    console.log('\n🎉 All tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - Server: ✅ Running`);
    console.log(`   - Database: ✅ Connected (${dbInfo.caseCount} cases)`);
    console.log(`   - Case Creation: ✅ Working`);
    console.log(`   - Recent Cases: ✅ Working (${recentCases.length} cases)`);
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Test in browser at http://localhost:5175');
    console.log('   2. Create a new case from the dashboard');
    console.log('   3. Verify it appears in Recent Cases');
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    console.log('\n🔧 Debug Steps:');
    console.log('   1. Check server logs for detailed error messages');
    console.log('   2. Verify database connection');
    console.log('   3. Check if all required environment variables are set');
  }
}

runTests();
