# PowerShell Test Script for Feedback Queue Endpoint
# Usage: .\test-feedback-endpoint.ps1 YOUR_TOKEN

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "🔍 Testing Feedback Queue Endpoint..." -ForegroundColor Cyan
Write-Host ""

# Test GET /api/templates/prompts/due
Write-Host "1. Testing GET /api/templates/prompts/due" -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/templates/prompts/due" -Method Get -Headers $headers
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    Write-Host ""
    if ($response.success) {
        Write-Host "Found $($response.count) due prompt(s)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "1. Backend is running on $BaseUrl"
    Write-Host "2. Token is valid"
    Write-Host "3. User has consent_analytics = true"
}

Write-Host ""
Write-Host "Expected: { 'success': true, 'data': [...], 'count': N }" -ForegroundColor Gray

