#!/bin/bash
# Quick API Test Script
# Tests basic endpoint functionality

BASE_URL="${1:-http://localhost:3000}"
API_ENDPOINT="${BASE_URL}/api/format/mode2"

echo "🧪 Testing API Endpoint: ${API_ENDPOINT}"
echo ""

# Test 1: Basic backward compatibility
echo "✅ Test 1: Backward Compatibility (templateId)"
curl -X POST "${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }' \
  -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n\n"

# Test 2: New templateRef
echo "✅ Test 2: New templateRef Parameter"
curl -X POST "${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateRef": "section7-ai-formatter",
    "language": "fr"
  }' \
  -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n\n"

# Test 3: Idempotency
IDEMPOTENCY_KEY="test-$(date +%s)"
echo "✅ Test 3: Idempotency Key (first request)"
curl -X POST "${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }' \
  -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n\n"

sleep 1

echo "✅ Test 3b: Idempotency Key (second request - should be cached)"
curl -X POST "${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }' \
  -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n\n"

# Test 4: Error handling
echo "❌ Test 4: Error Handling (invalid section)"
curl -X POST "${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "99",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n\n"

echo ""
echo "✅ Testing complete!"
