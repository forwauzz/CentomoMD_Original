const http = require('http');

function testTemplateAPI() {
  console.log('🧪 Testing Template API...\n');
  
  // Test 1: Health endpoint
  console.log('Test 1: Health endpoint');
  const healthReq = http.get('http://localhost:3001/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ Health endpoint:', JSON.parse(data));
      
      // Test 2: Test endpoint (bypasses auth)
      console.log('\nTest 2: Test endpoint (bypasses auth)');
      const testReq = http.get('http://localhost:3001/api/test/templates/7?language=fr', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('✅ Test endpoint:', JSON.parse(data));
          
          // Test 3: Original templates endpoint (with auth)
          console.log('\nTest 3: Original templates endpoint (with auth)');
          const templatesReq = http.get('http://localhost:3001/api/templates/7?language=fr', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              console.log('❌ Templates endpoint (expected 401):', JSON.parse(data));
            });
          });
          templatesReq.on('error', (err) => {
            console.log('❌ Templates endpoint error (expected):', err.message);
          });
        });
      });
      testReq.on('error', (err) => {
        console.log('❌ Test endpoint error:', err.message);
      });
    });
  });
  healthReq.on('error', (err) => {
    console.log('❌ Health endpoint error:', err.message);
  });
}

testTemplateAPI();
