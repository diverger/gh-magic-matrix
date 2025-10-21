# Test script to directly run the updated snake action
# This bypasses the simulation and tests our actual SVG generation code

param(
    [Parameter(Mandatory=$true)]
    [string]$Username = "demo-user",

    [Parameter(Mandatory=$false)]
    [string]$Theme = "dark",

    [Parameter(Mandatory=$false)]
    [string]$OutputFile = ""
)

# Set up timestamp
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Default output file
if (-not $OutputFile) {
    $OutputFile = ".\test-outputs\snake-direct-$Username-$Timestamp.svg"
}

# Ensure output directory exists
$OutputDir = Split-Path $OutputFile -Parent
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

Write-Host "🐍 Testing Snake Action Directly" -ForegroundColor Green
Write-Host "=================================="
Write-Host "  User: $Username"
Write-Host "  Theme: github-$Theme"
Write-Host "  Output: $OutputFile"
Write-Host "  Mode: Direct action test (with mock token)"

# Set up environment variables for the action
$env:INPUT_GITHUB_USER_NAME = $Username
$env:INPUT_OUTPUTS = "$OutputFile?palette=github-$Theme"
$env:GITHUB_TOKEN = "mock-token-for-testing"  # This will fail API but test our code path

Write-Host "`n🚀 Running snake action directly..." -ForegroundColor Yellow

try {
    # Run the action directly
    Push-Location "dist\snake"
    bun index.js
    Pop-Location

    # Check if output was generated
    if (Test-Path $OutputFile) {
        $FileInfo = Get-Item $OutputFile
        Write-Host "`n✅ Action completed!" -ForegroundColor Green
        Write-Host "📄 Saved to: $OutputFile" -ForegroundColor Cyan
        Write-Host "📊 File size: $([math]::Round($FileInfo.Length / 1KB, 2)) KB" -ForegroundColor Cyan

        # Read the content to check structure
        $Content = Get-Content $OutputFile -Raw
        Write-Host "📝 Lines: $((Get-Content $OutputFile).Count)" -ForegroundColor Cyan

        # Check SVG structure
        if ($Content -match '<svg[^>]*xmlns[^>]*>') {
            Write-Host "🎨 SVG structure: Valid (has xmlns)" -ForegroundColor Green
        } else {
            Write-Host "⚠️ SVG structure: Missing xmlns attribute" -ForegroundColor Yellow
        }

        if ($Content -match 'viewBox') {
            Write-Host "📐 ViewBox: Present" -ForegroundColor Green
        } else {
            Write-Host "⚠️ ViewBox: Missing" -ForegroundColor Yellow
        }

        if ($Content -match '<style>') {
            Write-Host "🎨 Styles: Present" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Styles: Missing" -ForegroundColor Yellow
        }

        if ($Content -match '--c[0-9]+:') {
            Write-Host "🎨 CSS Variables: Present" -ForegroundColor Green
        } else {
            Write-Host "⚠️ CSS Variables: Missing" -ForegroundColor Yellow
        }

        # Show preview
        $Preview = $Content.Substring(0, [Math]::Min(300, $Content.Length))
        Write-Host "`n🔍 SVG Preview (first 300 chars):" -ForegroundColor Cyan
        Write-Host $Preview

        # Copy to latest
        $LatestFile = ".\test-outputs\snake-direct-latest.svg"
        Copy-Item $OutputFile $LatestFile -Force
        Write-Host "🔗 Latest: $LatestFile" -ForegroundColor Cyan

    } else {
        Write-Host "`n❌ No output file generated" -ForegroundColor Red
        Write-Host "The action may have failed or no SVG was created" -ForegroundColor Yellow
    }

} catch {
    Write-Host "`n❌ Action failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red

    # Try to show any error output
    if (Test-Path "error.log") {
        Write-Host "`n📋 Error details:" -ForegroundColor Yellow
        Get-Content "error.log"
    }
}

Write-Host "`n🎯 Direct test completed!" -ForegroundColor Green