#!/bin/bash

# Phase 4 API Testing Script
# Tests model selection endpoints and integration

BASE_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Phase 4 API Testing Script"
echo "=============================="
echo ""

# Test 1: Models endpoint - Feature flag check
echo -e "${YELLOW}Test 1: /api/models/available (Feature Flag Check)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/models/available")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "403" ]; then
  echo -e "${GREEN}✅ PASS: Feature flag enforcement working (403 Forbidden)${NC}"
else
  echo -e "${RED}❌ FAIL: Expected 403, got $HTTP_CODE${NC}"
fi
echo "Response: $BODY"
echo ""

# Test 2: Models endpoint - Get specific model
echo -e "${YELLOW}Test 2: /api/models/gpt-4o-mini${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/models/gpt-4o-mini")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ PASS: Model info retrieved successfully${NC}"
else
  echo -e "${RED}❌ FAIL: Expected 200, got $HTTP_CODE${NC}"
fi
echo "Response: $BODY"
echo ""

# Test 3: Format endpoint - With templateRef
echo -e "${YELLOW}Test 3: /api/format/mode2 (With templateRef)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/format/mode2" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Test transcript content for API testing",
    "section": "7",
    "language": "fr",
    "templateRef": "section7-ai-formatter"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ PASS: Format endpoint accepts templateRef${NC}"
  # Check if response includes formatted content
  if echo "$BODY" | grep -q "formatted"; then
    echo -e "${GREEN}✅ PASS: Response includes formatted content${NC}"
  else
    echo -e "${YELLOW}⚠️  WARN: Response may not include formatted content${NC}"
  fi
else
  echo -e "${RED}❌ FAIL: Expected 200, got $HTTP_CODE${NC}"
fi
echo "Response: $BODY" | head -c 200
echo "..."
echo ""

# Test 4: Format endpoint - With model selection
echo -e "${YELLOW}Test 4: /api/format/mode2 (With model, seed, temperature)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/format/mode2" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Test transcript content for model selection",
    "section": "7",
    "language": "fr",
    "templateRef": "section7-ai-formatter",
    "model": "gpt-4o",
    "seed": 12345,
    "temperature": 0.8
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ PASS: Format endpoint accepts model/seed/temperature${NC}"
else
  echo -e "${RED}❌ FAIL: Expected 200, got $HTTP_CODE${NC}"
fi
echo "Response: $BODY" | head -c 200
echo "..."
echo ""

# Test 5: Format endpoint - Backward compatibility
echo -e "${YELLOW}Test 5: /api/format/mode2 (Backward Compatibility - templateId)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/format/mode2" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Test transcript content for backward compatibility",
    "section": "7",
    "language": "fr",
    "templateId": "section7-ai-formatter"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ PASS: Backward compatibility maintained (templateId)${NC}"
else
  echo -e "${RED}❌ FAIL: Backward compatibility broken (Expected 200, got $HTTP_CODE)${NC}"
fi
echo "Response: $BODY" | head -c 200
echo "..."
echo ""

echo "=============================="
echo -e "${GREEN}✅ API Testing Complete${NC}"
echo ""
echo "📝 Next Steps:"
echo "1. Enable feature flags in .env files"
echo "2. Test frontend ModelSelector component"
echo "3. Test full workflow in Transcript Analysis page"
echo "4. Check backend logs for model selection parameters"

