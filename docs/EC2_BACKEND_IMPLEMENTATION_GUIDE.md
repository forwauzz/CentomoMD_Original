# 🚀 EC2 Backend Implementation Guide (CentomoMD / Alie API)

This guide documents the full setup of the backend running on AWS EC2 with HTTPS + WebSockets, paired with the frontend on AWS Amplify, and routed through Cloudflare.

## 1. Infrastructure Overview

### Frontend:
- **AWS Amplify Hosting**
- URL: https://azure-production.d1deo9tihdnt50.amplifyapp.com

### Backend:
- **AWS EC2 instance** (ca-central-1 region)
- Public API endpoint: https://api.alie.app
- Runs Node.js / Express backend built from TypeScript

### Reverse Proxy:
- **Nginx** handles HTTPS termination and forwards to Node backend
- Certificates managed with **Let's Encrypt** (certbot)

### Database & Auth:
- **Supabase** (Auth + DB)
- Connected over HTTPS only

### Transcription Services:
- **AWS Transcribe** integration active

### Edge Layer:
- **Cloudflare** DNS + Proxy in front of Nginx
- SSL/TLS mode configured and validated

---

## 2. EC2 Setup

### Launch & Access
- Launched EC2 instance in Canada Central (ca-central-1)
- Connected via SSH with .pem key
- Installed required tools:

```bash
sudo yum update -y
sudo yum install -y nodejs npm git
```

### Repository Setup
```bash
git clone <repo-url>
cd backend
git checkout <branch>
```

Fixed ESM import issues by:
- Adding .js extensions
- Using relative paths

Built the project:
```bash
npm install
npm run build
```

---

## 3. Environment Configuration

### .env file (stored in /backend/.env):
```env
# Server
HOST=0.0.0.0
PORT=3001

# CORS
CORS_ALLOWED_ORIGINS=https://azure-production.d1deo9tihdnt50.amplifyapp.com

# WebSockets
PUBLIC_WS_URL=wss://api.alie.app
USE_WSS=true

# Supabase
SUPABASE_URL=...
SUPABASE_ANON_KEY=...

# AWS
AWS_REGION=ca-central-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

🔒 **Secured with:**
```bash
chmod 600 .env
```

---

## 4. Nginx Reverse Proxy

### File: `/etc/nginx/sites-available/api.alie.app`
```nginx
server {
    server_name api.alie.app;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Enable + restart:
```bash
ln -s /etc/nginx/sites-available/api.alie.app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### TLS with certbot:
```bash
sudo certbot --nginx -d api.alie.app
```

---

## 5. Running the Backend

### Manual Run
```bash
node dist/src/index.js
```

### (Recommended) Systemd Service

#### File: `/etc/systemd/system/alie-backend.service`
```ini
[Unit]
Description=Alie Backend
After=network.target

[Service]
ExecStart=/usr/bin/node /home/ec2-user/backend/dist/src/index.js
Restart=always
User=ec2-user
EnvironmentFile=/home/ec2-user/backend/.env

[Install]
WantedBy=multi-user.target
```

#### Enable & start:
```bash
sudo systemctl enable alie-backend
sudo systemctl start alie-backend
```

---

## 6. WebSockets

### Endpoint: `wss://api.alie.app/ws`

### Test command:
```bash
curl -i -N --http1.1 \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: api.alie.app" \
  -H "Origin: https://api.alie.app" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  https://api.alie.app/ws/transcription
```

### Expected response:
```
HTTP/1.1 101 Switching Protocols
...
{"type":"connection_established","payload":{"sessionId":"dev-session-id"}}
```

---

## 7. Compliance Notes

- **Canadian data residency**: EC2 + Amplify in ca-central-1
- **PIPEDA/Law 25**: No cross-border storage; logs, cache, and temp storage must be configured to remain in-region
- **Zero retention**: Temporary files handled via lifecycle rules (e.g., S3 auto-expiry)

---

## 8. Operational Runbook

### Start backend:
```bash
sudo systemctl start alie-backend
```

### Stop backend:
```bash
sudo systemctl stop alie-backend
```

### Restart backend:
```bash
sudo systemctl restart alie-backend
```

### Check logs:
```bash
journalctl -u alie-backend -f
```

### Renew TLS certs:
```bash
sudo certbot renew --dry-run
```

---

## 9. Cloudflare Integration ✅

### DNS:
- `api.alie.app` pointed to EC2 instance via Cloudflare DNS
- Proxy (orange cloud) enabled

### SSL/TLS Mode:
- Configured to **Full (Strict)** so Cloudflare validates the origin's Let's Encrypt cert
- Confirmed that both edge (Cloudflare) and origin (Nginx) serve valid HTTPS

### Validation:
- ✅ Passed Cloudflare SSL checks
- ✅ WebSockets successfully upgraded (101 Switching Protocols) when routed through Cloudflare
- ✅ `api.alie.app` reachable securely worldwide via Cloudflare edge network

### Benefits:
- DDoS protection at edge
- Global caching for static responses (if configured)
- Additional compliance layer: traffic encrypted from client → Cloudflare → EC2

---

## 10. Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Cloudflare    │    │   Nginx         │    │   Node.js       │
│   (Amplify)     │───▶│   (Edge)        │───▶│   (Reverse      │───▶│   (Backend)     │
│                 │    │                 │    │    Proxy)       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │                       │                       │                       ▼
         │                       │                       │              ┌─────────────────┐
         │                       │                       │              │   Supabase      │
         │                       │                       │              │   (Auth + DB)   │
         │                       │                       │              │                 │
         │                       │                       │              └─────────────────┘
         │                       │                       │                       │
         │                       │                       │                       ▼
         │                       │                       │              ┌─────────────────┐
         │                       │                       │              │   AWS Transcribe│
         │                       │                       │              │   (STT)         │
         │                       │                       │              │                 │
         │                       │                       │              └─────────────────┘
```

---

## 11. Security Checklist

- [ ] ✅ Environment variables secured (chmod 600)
- [ ] ✅ HTTPS enforced with Let's Encrypt certificates
- [ ] ✅ CORS configured for specific origins
- [ ] ✅ WebSocket connections secured (WSS)
- [ ] ✅ Cloudflare proxy enabled for DDoS protection
- [ ] ✅ Canadian data residency maintained (ca-central-1)
- [ ] ✅ Systemd service configured for auto-restart
- [ ] ✅ Nginx configured for proper proxy headers

---

## 12. Monitoring & Maintenance

### Health Checks
- Backend health endpoint: `https://api.alie.app/health`
- WebSocket connectivity: Test with curl command above
- SSL certificate expiry: Monitor with certbot

### Log Locations
- Application logs: `journalctl -u alie-backend -f`
- Nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- System logs: `/var/log/messages`

### Backup Strategy
- Environment configuration: Store securely off-server
- Database: Handled by Supabase
- Application code: Version controlled in Git

---

## 13. WebSocket Path Fix & Validation — Sep 30, 2025

### Context/Symptom
- Frontend failed to open `wss://api.alie.app/ws` (browser console showed WS error)
- Nginx access log showed `GET /ws → 400`
- Direct Node test to `/ws` returned 400

### Root Cause
- Backend WS server listens on `/ws/transcription` (`new WebSocketServer({ path: '/ws/transcription' })`)
- Nginx was initially forwarding `/ws` incorrectly and had escaped header vars

### What We Implemented

#### Aligned Nginx WS route
Map public `/ws` → backend `/ws/transcription`:

```nginx
location /ws {
    proxy_pass http://127.0.0.1:3001/ws/transcription;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 3600;
    proxy_send_timeout 3600;
}
```

#### Fixed header variables
Removed backslashes so Nginx sends real `$http_upgrade`/`$host` values (not literals).

#### Reloaded Nginx (no downtime)
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Verification

#### Direct Node (origin):
```bash
curl -i -N --http1.1 -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Sec-WebSocket-Version: 13" \
  http://127.0.0.1:3001/ws/transcription
```
→ `101 Switching Protocols` + `{"type":"connection_established", ...}`

#### Through Nginx (public):
```bash
curl -i -N --http1.1 -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Host: api.alie.app" -H "Origin: https://api.alie.app" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Sec-WebSocket-Version: 13" \
  https://api.alie.app/ws
```
→ `101 Switching Protocols` + connection payload

**Logs**: `/var/log/nginx/access.log` shows `GET /ws → 101`; no related errors.

### State Summary
- **Frontend**: connects to `wss://api.alie.app/ws` (unchanged)
- **Nginx**: rewrites `/ws` → `/ws/transcription` and forwards correct Upgrade headers
- **Backend**: Node on `:3001`; WS server at `/ws/transcription`; `/healthz` returns 200
- **TLS/Cloudflare/REST `/api/*`**: unchanged and healthy

### Rollback / Future
If backend is later changed to listen on `/ws`, switch Nginx to pass-through:
```nginx
location /ws { proxy_pass http://127.0.0.1:3001; }
```

---

**Last Updated**: 2025-09-30  
**Status**: ✅ **PRODUCTION READY**  
**Environment**: AWS EC2 + Amplify + Cloudflare
