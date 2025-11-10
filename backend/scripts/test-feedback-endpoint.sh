#!/bin/bash
# Test script for Feedback Queue Endpoint
# Usage: ./test-feedback-endpoint.sh YOUR_TOKEN

TOKEN=$1
BASE_URL="http://localhost:3000"

if [ -z "$TOKEN" ]; then
  echo "Usage: ./test-feedback-endpoint.sh YOUR_TOKEN"
  echo "Get token from browser DevTools > Application > Local Storage > supabase.auth.token"
  exit 1
fi

echo "🔍 Testing Feedback Queue Endpoint..."
echo ""

# Test GET /api/templates/prompts/due
echo "1. Testing GET /api/templates/prompts/due"
curl -X GET "${BASE_URL}/api/templates/prompts/due" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "✅ Test complete!"
echo ""
echo "Expected: { 'success': true, 'data': [...], 'count': N }"

