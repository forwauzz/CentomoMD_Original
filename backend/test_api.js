// Test the Mode 1 API endpoint directly
import http from 'http';

const rawTranscript = `Patient is a forty five year old male comma new consultation for right knee pain period
He reports the pain started three weeks ago comma after a soccer match period
Denies trauma comma swelling comma or redness period
Past medical history colon hypertension comma controlled with medication period
Current medications colon ramipril five milligrams daily period
No known drug allergies period
On exam comma knee inspection shows mild tenderness on palpation period
Range of motion is full comma no instability noted period
Vital signs stable period
Plan colon order X ray of right knee comma refer to physiotherapy comma start acetaminophen one gram TID period
Follow up in four weeks period new paragraph
Patient understands and agrees with plan period`;

const postData = JSON.stringify({
  transcript: rawTranscript,
  language: 'en',
  quote_style: 'smart',
  radiology_mode: false,
  section: '7'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/format/mode1',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': 'Bearer test-token' // You'll need a real token
  }
};

console.log('🧪 Testing Mode 1 API Endpoint...\n');
console.log('📝 Raw Transcript:');
console.log(rawTranscript);
console.log('\n');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📋 API Response:');
    console.log('================');
    try {
      const response = JSON.parse(data);
      console.log('Formatted Text:');
      console.log(response.formatted || 'No formatted text');
      console.log('\nIssues:', response.issues || 'None');
      console.log('Validation:', response.validation || 'None');
      console.log('Success:', response.success);
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
