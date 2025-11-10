# Phase 4 API Testing Script (PowerShell)
# Tests model selection endpoints and integration

$BASE_URL = "http://localhost:3001"

Write-Host "🧪 Phase 4 API Testing Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Models endpoint - Feature flag check
Write-Host "Test 1: /api/models/available (Feature Flag Check)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/models/available" -Method GET -ErrorAction Stop
    Write-Host "❌ FAIL: Expected 403 Forbidden, got $($response.StatusCode)" -ForegroundColor Red
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ PASS: Feature flag enforcement working (403 Forbidden)" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: Models endpoint - Get specific model
Write-Host "Test 2: /api/models/gpt-4o-mini" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/models/gpt-4o-mini" -Method GET
    Write-Host "✅ PASS: Model info retrieved successfully" -ForegroundColor Green
    $body = $response.Content | ConvertFrom-Json
    Write-Host "Model: $($body.model.name) ($($body.model.provider))" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAIL: Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Format endpoint - With templateRef
Write-Host "Test 3: /api/format/mode2 (With templateRef)" -ForegroundColor Yellow
$body3 = @{
    transcript = "Test transcript content for API testing"
    section = "7"
    language = "fr"
    templateRef = "section7-ai-formatter"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/format/mode2" -Method POST `
        -ContentType "application/json" -Body $body3
    Write-Host "✅ PASS: Format endpoint accepts templateRef" -ForegroundColor Green
    $responseBody = $response.Content | ConvertFrom-Json
    if ($responseBody.formatted) {
        Write-Host "✅ PASS: Response includes formatted content" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ FAIL: Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Format endpoint - With model selection
Write-Host "Test 4: /api/format/mode2 (With model, seed, temperature)" -ForegroundColor Yellow
$body4 = @{
    transcript = "Test transcript content for model selection"
    section = "7"
    language = "fr"
    templateRef = "section7-ai-formatter"
    model = "gpt-4o"
    seed = 12345
    temperature = 0.8
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/format/mode2" -Method POST `
        -ContentType "application/json" -Body $body4
    Write-Host "✅ PASS: Format endpoint accepts model/seed/temperature" -ForegroundColor Green
} catch {
    Write-Host "❌ FAIL: Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Format endpoint - Backward compatibility
Write-Host "Test 5: /api/format/mode2 (Backward Compatibility - templateId)" -ForegroundColor Yellow
$body5 = @{
    transcript = "Test transcript content for backward compatibility"
    section = "7"
    language = "fr"
    templateId = "section7-ai-formatter"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/format/mode2" -Method POST `
        -ContentType "application/json" -Body $body5
    Write-Host "✅ PASS: Backward compatibility maintained (templateId)" -ForegroundColor Green
} catch {
    Write-Host "❌ FAIL: Backward compatibility broken: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "==============================" -ForegroundColor Cyan
Write-Host "✅ API Testing Complete" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Enable feature flags in .env files" -ForegroundColor Gray
Write-Host "2. Test frontend ModelSelector component" -ForegroundColor Gray
Write-Host "3. Test full workflow in Transcript Analysis page" -ForegroundColor Gray
Write-Host "4. Check backend logs for model selection parameters" -ForegroundColor Gray
