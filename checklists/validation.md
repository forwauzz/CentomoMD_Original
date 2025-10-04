# CentomoMD Infrastructure Validation Checklist

**Purpose**: Validate runtime reality against codebase audit findings  
**Environment**: Production (EC2 + Nginx + Cloudflare + Amplify)  
**Last Updated**: 2025-01-27

## Prerequisites

- SSH access to EC2 instance
- Browser developer tools access
- curl command available
- AWS CLI configured (optional)

---

## 1. Server Configuration Validation

### 1.1 Nginx Configuration
```bash
# Check Nginx configuration syntax
sudo nginx -t

# View full Nginx configuration
sudo nginx -T

# Verify WebSocket path mapping
sudo nginx -T | grep -A 10 "location /ws"

# Check SSL certificate status
sudo certbot certificates
```

**Expected Results**:
- ✅ Nginx configuration syntax valid
- ✅ `/ws` location block maps to `/ws/transcription`
- ✅ WebSocket upgrade headers present
- ✅ SSL certificates valid and not expired

### 1.2 Backend Service Status
```bash
# Check Node.js service status
sudo systemctl status alie-backend

# View recent logs
journalctl -u alie-backend -f --since "1 hour ago"

# Check if service is listening on correct port
sudo netstat -tlnp | grep :3001

# Verify environment variables
sudo systemctl show alie-backend --property=Environment
```

**Expected Results**:
- ✅ Service running and active
- ✅ Listening on port 3001
- ✅ Environment variables loaded correctly
- ✅ No critical errors in logs

### 1.3 File System and Permissions
```bash
# Check .env file permissions
ls -la /home/ec2-user/backend/.env

# Verify application files
ls -la /home/ec2-user/backend/dist/src/

# Check Nginx configuration files
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/
```

**Expected Results**:
- ✅ .env file has 600 permissions
- ✅ Application files exist and are readable
- ✅ Nginx configuration files present

---

## 2. Network and Connectivity Validation

### 2.1 DNS and SSL
```bash
# Check DNS resolution
nslookup api.alie.app

# Verify SSL certificate
openssl s_client -connect api.alie.app:443 -servername api.alie.app

# Test HTTPS connectivity
curl -I https://api.alie.app/healthz
```

**Expected Results**:
- ✅ DNS resolves to EC2 instance IP
- ✅ SSL certificate valid and not expired
- ✅ HTTPS connection successful
- ✅ Health endpoint returns 200

### 2.2 WebSocket Connectivity
```bash
# Test WebSocket upgrade
curl -i -N --http1.1 \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: api.alie.app" \
  -H "Origin: https://api.alie.app" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  https://api.alie.app/ws
```

**Expected Results**:
- ✅ HTTP 101 Switching Protocols
- ✅ WebSocket connection established
- ✅ Connection payload received

### 2.3 API Endpoints
```bash
# Test health endpoint
curl https://api.alie.app/healthz

# Test API endpoint
curl https://api.alie.app/api/config

# Test CORS headers
curl -H "Origin: https://azure-production.d1deo9tihdnt50.amplifyapp.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.alie.app/api/config
```

**Expected Results**:
- ✅ Health endpoint returns 200
- ✅ API endpoints accessible
- ✅ CORS headers present for production origin

---

## 3. Frontend Validation

### 3.1 Environment Variables
```javascript
// In browser console
console.log('Environment Variables:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SITE_URL: import.meta.env.VITE_SITE_URL
});
```

**Expected Results**:
- ✅ All required environment variables present
- ✅ Production URLs configured correctly
- ✅ No undefined values

### 3.2 WebSocket Connection
```javascript
// Test WebSocket connection
const ws = new WebSocket('wss://api.alie.app/ws');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onerror = (e) => console.error('❌ WebSocket error:', e);
ws.onmessage = (e) => console.log('📨 Message received:', e.data);
ws.onclose = (e) => console.log('🔌 WebSocket closed:', e.code, e.reason);
```

**Expected Results**:
- ✅ WebSocket connection successful
- ✅ No connection errors
- ✅ Messages received properly

### 3.3 Audio Capture
```javascript
// Test audio capture settings
navigator.mediaDevices.getUserMedia({audio: true})
  .then(stream => {
    const track = stream.getAudioTracks()[0];
    const settings = track.getSettings();
    console.log('Audio Settings:', {
      sampleRate: settings.sampleRate,
      channelCount: settings.channelCount,
      echoCancellation: settings.echoCancellation,
      noiseSuppression: settings.noiseSuppression,
      autoGainControl: settings.autoGainControl
    });
    track.stop();
  })
  .catch(e => console.error('❌ Audio capture failed:', e));
```

**Expected Results**:
- ✅ Audio capture successful
- ✅ Sample rate: 16000 (or browser default)
- ✅ Channel count: 1 (mono)
- ✅ Audio processing settings as expected

---

## 4. AWS Services Validation

### 4.1 AWS Transcribe
```bash
# Check AWS credentials
aws sts get-caller-identity

# Test Transcribe service access
aws transcribe list-vocabularies --region ca-central-1
```

**Expected Results**:
- ✅ AWS credentials valid
- ✅ Transcribe service accessible
- ✅ Region: ca-central-1

### 4.2 S3 Bucket
```bash
# Check S3 bucket access
aws s3 ls s3://centomomd-input-2025 --region ca-central-1

# Verify bucket policy
aws s3api get-bucket-policy --bucket centomomd-input-2025 --region ca-central-1
```

**Expected Results**:
- ✅ S3 bucket accessible
- ✅ Bucket policy configured
- ✅ Region: ca-central-1

---

## 5. Supabase Validation

### 5.1 Database Connection
```javascript
// Test Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Test connection
supabase.from('profiles').select('count').then(result => {
  console.log('✅ Supabase connected:', result);
}).catch(e => console.error('❌ Supabase error:', e));
```

**Expected Results**:
- ✅ Supabase connection successful
- ✅ Database queries work
- ✅ No authentication errors

### 5.2 Authentication
```javascript
// Test authentication flow
supabase.auth.getSession().then(result => {
  console.log('Auth session:', result);
});
```

**Expected Results**:
- ✅ Authentication service accessible
- ✅ Session management working
- ✅ No auth errors

---

## 6. Performance and Monitoring

### 6.1 Response Times
```bash
# Test API response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.alie.app/healthz

# Create curl-format.txt with:
# time_namelookup:  %{time_namelookup}\n
# time_connect:     %{time_connect}\n
# time_appconnect:  %{time_appconnect}\n
# time_pretransfer: %{time_pretransfer}\n
# time_redirect:    %{time_redirect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total:       %{time_total}\n
```

**Expected Results**:
- ✅ Response times < 500ms
- ✅ No timeouts
- ✅ Consistent performance

### 6.2 Resource Usage
```bash
# Check system resources
top -bn1 | head -20
free -h
df -h

# Check Node.js process
ps aux | grep node
```

**Expected Results**:
- ✅ CPU usage < 80%
- ✅ Memory usage < 80%
- ✅ Disk space available
- ✅ Node.js process stable

---

## 7. Security Validation

### 7.1 SSL/TLS Configuration
```bash
# Test SSL configuration
openssl s_client -connect api.alie.app:443 -servername api.alie.app -showcerts

# Check SSL Labs rating (manual)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=api.alie.app
```

**Expected Results**:
- ✅ SSL certificate valid
- ✅ Strong cipher suites
- ✅ No SSL vulnerabilities

### 7.2 CORS Configuration
```bash
# Test CORS with different origins
curl -H "Origin: https://malicious-site.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api.alie.app/api/config
```

**Expected Results**:
- ✅ CORS blocks unauthorized origins
- ✅ Only production origin allowed
- ✅ Proper CORS headers

---

## 8. Error Scenarios

### 8.1 WebSocket Disconnection
```javascript
// Test WebSocket reconnection
const ws = new WebSocket('wss://api.alie.app/ws');
ws.onclose = () => {
  console.log('Testing reconnection...');
  setTimeout(() => {
    const ws2 = new WebSocket('wss://api.alie.app/ws');
    ws2.onopen = () => console.log('✅ Reconnection successful');
  }, 1000);
};
```

### 8.2 Audio Capture Failure
```javascript
// Test audio capture error handling
navigator.mediaDevices.getUserMedia({audio: true})
  .then(stream => {
    // Simulate error
    stream.getTracks().forEach(track => track.stop());
    console.log('✅ Error handling working');
  })
  .catch(e => console.log('✅ Error caught:', e.message));
```

---

## 9. Compliance Validation

### 9.1 Data Residency
```bash
# Verify AWS region
aws configure get region

# Check S3 bucket region
aws s3api get-bucket-location --bucket centomomd-input-2025
```

**Expected Results**:
- ✅ All services in ca-central-1
- ✅ No cross-border data transfer
- ✅ Canadian data residency maintained

### 9.2 Logging and Audit
```bash
# Check audit logs
sudo journalctl -u alie-backend --since "1 day ago" | grep -i audit

# Verify log retention
sudo find /var/log -name "*.log" -mtime +30 | wc -l
```

**Expected Results**:
- ✅ Audit logs present
- ✅ Log retention policies followed
- ✅ No PHI in logs

---

## 10. Validation Summary

### Checklist Results
- [ ] Server Configuration (Nginx, Backend, Files)
- [ ] Network Connectivity (DNS, SSL, WebSocket, API)
- [ ] Frontend Validation (Environment, WebSocket, Audio)
- [ ] AWS Services (Transcribe, S3)
- [ ] Supabase (Database, Auth)
- [ ] Performance (Response times, Resources)
- [ ] Security (SSL, CORS)
- [ ] Error Handling (WebSocket, Audio)
- [ ] Compliance (Data residency, Logging)

### Critical Issues Found
- [ ] Sample rate mismatch (Frontend 16kHz vs Backend 48kHz)
- [ ] Nginx configuration not version controlled
- [ ] Rate limiting disabled
- [ ] Authentication optional in production

### Recommendations
1. **Immediate**: Fix sample rate mismatch
2. **High Priority**: Version control Nginx configuration
3. **Medium Priority**: Enable rate limiting and authentication
4. **Low Priority**: Implement comprehensive monitoring

---

**Validation Date**: ___________  
**Validated By**: ___________  
**Environment**: Production  
**Status**: ⚠️ Operational with risks
