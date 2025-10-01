# Validation Checklist (After Adoption)

- [ ] `curl -sI https://api.alie.app/healthz` → 200
- [ ] `curl -sI https://api.alie.app/api/config` shows `content-security-policy` header
- [ ] WebSocket upgrade:
      curl -i -N --http1.1 \
        -H "Connection: Upgrade" \
        -H "Upgrade: websocket" \
        -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
        -H "Sec-WebSocket-Version: 13" \
        https://api.alie.app/ws  | head
      # Expect "101 Switching Protocols"
- [ ] App still connects to wss://api.alie.app/ws and streams properly
