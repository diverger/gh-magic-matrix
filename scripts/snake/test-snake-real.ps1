# PowerShell test script using real GitHub contribution data
#
# Usage:
#   .\scripts\snake\test-snake-real.ps1 [username] [light|dark]
#
# This script fetches real contribution data from GitHub's public profile
# and tests the SVG generation with actual data.

param(
    [Parameter(Position=0)]
    [string]$Username = "octocat",

    [Parameter(Position=1)]
    [ValidateSet("light", "dark")]
    [string]$Theme = "dark"
)

# Create test-outputs directory if it doesn't exist
$TestOutputDir = Join-Path $PWD "test-outputs"
if (-not (Test-Path $TestOutputDir)) {
    New-Item -ItemType Directory -Path $TestOutputDir | Out-Null
}

# Generate filename with timestamp
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = Join-Path $TestOutputDir "snake-real-$Username-$Timestamp.svg"

# Theme configuration
$ThemePalette = if ($Theme -eq "light") { "github-light" } else { "github-dark" }

Write-Host "🐍 Testing Snake with Real GitHub Data" -ForegroundColor Green
Write-Host "======================================="
Write-Host "  User: $Username"
Write-Host "  Theme: $ThemePalette"
Write-Host "  Output: $OutputFile"
Write-Host "  Mode: Real GitHub contribution data"
Write-Host ""

# Test if the user exists
Write-Host "🔍 Checking if user '$Username' exists..." -ForegroundColor Yellow
try {
    $userInfo = Invoke-RestMethod -Uri "https://api.github.com/users/$Username" -Method Get
    Write-Host "✅ User found: $($userInfo.name)" -ForegroundColor Green
    Write-Host "   Public repos: $($userInfo.public_repos)" -ForegroundColor Cyan
    Write-Host "   Followers: $($userInfo.followers)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ User '$Username' not found or API error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 Fetching contribution data from GitHub..." -ForegroundColor Yellow

# GitHub provides an SVG of the contribution graph that we can parse
$contributionUrl = "https://github.com/users/$Username/contributions"

try {
    # Fetch the contributions page
    $contributionResponse = Invoke-WebRequest -Uri $contributionUrl -UseBasicParsing
    Write-Host "✅ Successfully fetched contribution data" -ForegroundColor Green

    # Parse contribution data from the HTML
    # GitHub's contribution graph contains data attributes we can extract
    $contributionPattern = 'data-level="(\d+)".*?data-date="([^"]+)"'
    $contributionMatches = [regex]::Matches($contributionResponse.Content, $contributionPattern)

    Write-Host "📈 Found $($contributionMatches.Count) contribution days" -ForegroundColor Cyan

    if ($contributionMatches.Count -eq 0) {
        Write-Host "⚠️  No contribution data found, using fallback..." -ForegroundColor Yellow
        # We'll continue with the action anyway - it might still work
    }

} catch {
    Write-Host "⚠️  Failed to fetch contribution data: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   Continuing with action test anyway..." -ForegroundColor Yellow
}

# Check if snake action directory exists
$SnakeActionDir = "packages\snake\packages\action"
if (-not (Test-Path $SnakeActionDir)) {
    Write-Host "❌ Error: Snake action directory not found at $SnakeActionDir" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Building snake action package..." -ForegroundColor Yellow
Push-Location $SnakeActionDir

try {
    # Build if needed
    if (-not (Test-Path "..\..\..\..\dist\snake\index.js")) {
        Write-Host "🔨 Building with ncc..." -ForegroundColor Yellow
        & bun run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Error: Build failed" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✅ Using existing build" -ForegroundColor Green
    }

    Write-Host "✅ Build completed successfully" -ForegroundColor Green
    Write-Host ""

    # Set environment variables for the snake action
    $env:INPUT_GITHUB_USER_NAME = $Username
    $env:INPUT_OUTPUTS = "$OutputFile?palette=$ThemePalette"

    # Try without GITHUB_TOKEN first (might work for public data)
    Write-Host "🚀 Running snake action with public data..." -ForegroundColor Yellow
    & bun ..\..\..\..\dist\snake\index.js

    $ActionResult = $LASTEXITCODE

} finally {
    Pop-Location
}

# Check results
if ($ActionResult -eq 0 -and (Test-Path $OutputFile)) {
    Write-Host ""
    Write-Host "✅ Snake animation generated successfully with real data!" -ForegroundColor Green
    Write-Host "📁 Saved to: $OutputFile"

    $FileSize = (Get-Item $OutputFile).Length
    $FileSizeKB = [math]::Round($FileSize / 1KB, 2)
    Write-Host "📊 File size: $FileSizeKB KB"

    # Get file info
    $Lines = (Get-Content $OutputFile).Count
    Write-Host "📄 Lines: $Lines"

    # Check SVG structure
    $Content = Get-Content $OutputFile -Raw
    if ($Content -match "<svg" -and $Content -match "</svg>") {
        Write-Host "🎨 SVG structure: Valid" -ForegroundColor Green
    } else {
        Write-Host "⚠️  SVG structure: May be invalid" -ForegroundColor Yellow
    }

    # Check for animation
    if ($Content -match "animateMotion|animate") {
        Write-Host "🎬 Animation: Detected" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Animation: Not detected" -ForegroundColor Yellow
    }

    # Create a latest link
    $LatestLink = Join-Path $TestOutputDir "snake-real-latest.svg"
    if (Test-Path $LatestLink) {
        Remove-Item $LatestLink
    }
    Copy-Item $OutputFile $LatestLink
    Write-Host "🔗 Latest: $LatestLink"

    Write-Host ""
    Write-Host "🎯 Real data test completed successfully!" -ForegroundColor Green
    Write-Host "   You can open the SVG in a browser to view the animation:"
    Write-Host "   file:///$($OutputFile.Replace('\', '/'))"

} else {
    Write-Host ""
    Write-Host "❌ Action failed or no output generated" -ForegroundColor Red
    Write-Host "   This is expected if no GitHub token is available" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 To test with full functionality, set a GitHub token:" -ForegroundColor Cyan
    Write-Host "   `$env:GITHUB_TOKEN = 'your_token_here'" -ForegroundColor Green
    Write-Host "   .\scripts\snake\test-snake-real.ps1 $Username $Theme" -ForegroundColor Green
}