# Start Worker with remote Cloudflare services (Workers AI enabled)
# This script starts wrangler dev WITHOUT --local flag

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Starting RAG Worker" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: This uses Cloudflare's remote services:" -ForegroundColor Yellow
Write-Host "  - Workers AI (LLM)" -ForegroundColor Gray
Write-Host "  - D1 Database" -ForegroundColor Gray
Write-Host "  - Vectorize Index" -ForegroundColor Gray
Write-Host "  - KV Namespace" -ForegroundColor Gray
Write-Host ""
Write-Host "Make sure you're logged in: wrangler login" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting Worker on http://localhost:8787..." -ForegroundColor Green
Write-Host ""

cd $PSScriptRoot
wrangler dev --remote

