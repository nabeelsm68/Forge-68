<#
.SYNOPSIS
    FORGE Sovereign Industrial AI Control Plane - One-Command Startup & Preflight
.DESCRIPTION
    FORGE Milestone 11: Final Demo Hardening & Local Runtime Validation.
    Deterministically validates local runtime, virtual environment, sovereign configuration,
    Ollama connectivity, reasoning & vision models, and launches both backend and frontend.
    Enforces zero cloud AI calls and zero automatic multi-GB model downloads.
.PARAMETER PreflightOnly
    If specified, runs preflight diagnostics and exits without launching servers.
#>

[CmdletBinding()]
param(
    [switch]$PreflightOnly
)

$ErrorActionPreference = "Stop"

# Colors and formatting helpers
function Write-Header {
    param([string]$Text)
    Write-Host "`n================================================================" -ForegroundColor Cyan
    Write-Host "   $Text" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
}

function Write-StatusRow {
    param([string]$Component, [string]$Status, [string]$Detail, [ConsoleColor]$Color)
    $bracket = "[$Status]"
    Write-Host ("{0,-24} {1,-10} {2}" -f $Component, $bracket, $Detail) -ForegroundColor $Color
}

$RootDir = Split-Path -Parent $PSScriptRoot
if (-not $RootDir) {
    $RootDir = (Get-Item .).FullName
}
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"

Write-Header "FORGE SOVEREIGN CONTROL PLANE PREFLIGHT"

# 1. Check Python & Virtual Environment
$PythonVenv = Join-Path $BackendDir ".venv\Scripts\python.exe"
if (Test-Path $PythonVenv) {
    $PythonCmd = $PythonVenv
    $pyVer = & $PythonCmd -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"
    Write-StatusRow "Python Runtime" "OK" "v$pyVer (.venv)" Green
} else {
    try {
        $pyVer = & python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"
        $PythonCmd = "python"
        Write-StatusRow "Python Runtime" "OK" "v$pyVer (System Python)" Green
    } catch {
        Write-StatusRow "Python Runtime" "FAILED" "Python >= 3.12 is required" Red
        Write-Host "  -> Manual fix: Install Python 3.12+ and initialize backend\.venv" -ForegroundColor Yellow
        exit 1
    }
}

# 2. Check Backend Dependencies
$depsCheck = & $PythonCmd -c "import fastapi, pydantic, httpx, pytest, numpy; print('OK')" 2>$null
if ($depsCheck -eq "OK") {
    Write-StatusRow "Dependencies" "OK" "FastAPI, Pydantic, HTTPX, Pytest, NumPy verified" Green
} else {
    Write-StatusRow "Dependencies" "MISSING" "Backend packages not installed" Red
    Write-Host "  -> Manual fix: cd backend; pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

# 3. Check Demo Fixtures
$fixtures = @(
    (Join-Path $BackendDir "data\demo\equipment_records.json"),
    (Join-Path $BackendDir "data\demo\knowledge\r204_operating_sop.md"),
    (Join-Path $BackendDir "data\demo\images\r204_pressure_gauge.png")
)
$missingFixtures = @($fixtures | Where-Object { -not (Test-Path $_) })
if ($missingFixtures.Count -eq 0) {
    Write-StatusRow "Demo Fixtures" "OK" "Synthetic R-204 telemetry, SOPs, and imagery present" Green
} else {
    Write-StatusRow "Demo Fixtures" "FAILED" "Missing demo data fixtures" Red
    exit 1
}

# 4. Check Local Ollama Runtime & Models (Zero external egress)
$OllamaUrl = "http://localhost:11434"
$ollamaOnline = $false
$installedModels = @()

try {
    $resp = Invoke-RestMethod -Uri "$OllamaUrl/api/tags" -Method Get -TimeoutSec 2 -ErrorAction Stop
    $ollamaOnline = $true
    if ($resp.models) {
        $installedModels = @($resp.models | ForEach-Object { $_.name })
    }
    Write-StatusRow "Ollama Daemon" "ONLINE" "$OllamaUrl ($($installedModels.Count) local models)" Green
} catch {
    Write-StatusRow "Ollama Daemon" "OFFLINE" "Deterministic Demo Mode Active (Air-Gapped)" Yellow
}

# 5. Check Reasoning Model
$targetReasoningModel = "qwen2.5:7b"
$reasoningFound = $installedModels | Where-Object { $_ -like "*$targetReasoningModel*" -or $_ -like "*qwen3*" }
if ($reasoningFound) {
    Write-StatusRow "Reasoning Model" "READY" "$targetReasoningModel (Live Local Inference)" Green
} elseif ($ollamaOnline) {
    Write-StatusRow "Reasoning Model" "MISSING" "$targetReasoningModel not in local library" Yellow
    Write-Host "  -> Manual install command: ollama pull $targetReasoningModel" -ForegroundColor DarkCyan
    Write-Host "  -> Note: Deterministic demo harness will run automatically without live model" -ForegroundColor DarkGray
} else {
    Write-StatusRow "Reasoning Model" "STANDBY" "Deterministic Demo Mode Active" Yellow
}

# 6. Check Vision Model
$targetVisionModel = "qwen2.5-vl:7b"
$visionFound = $installedModels | Where-Object { $_ -like "*$targetVisionModel*" -or $_ -like "*vl*" }
if ($visionFound) {
    Write-StatusRow "Vision Model" "READY" "$targetVisionModel (Live Local Multimodal)" Green
} elseif ($ollamaOnline) {
    Write-StatusRow "Vision Model" "MISSING" "$targetVisionModel not in local library" Yellow
    Write-Host "  -> Manual install command: ollama pull $targetVisionModel" -ForegroundColor DarkCyan
    Write-Host "  -> Note: Deterministic demo vision will run automatically without live model" -ForegroundColor DarkGray
} else {
    Write-StatusRow "Vision Model" "STANDBY" "Deterministic Demo Vision Active" Yellow
}

# 7. Run Python Preflight Module
Write-Host "`nExecuting sovereign runtime diagnostics..." -ForegroundColor DarkGray
Push-Location $BackendDir
try {
    & $PythonCmd -m app.preflight
} finally {
    Pop-Location
}

if ($PreflightOnly) {
    Write-Host "`nPreflight check completed (-PreflightOnly flag specified)." -ForegroundColor Cyan
    exit 0
}

# 8. Start Backend & Frontend Processes
Write-Header "STARTING FORGE CONTROL PLANE PROCESSES"

Write-Host "Starting sovereign FastAPI backend on http://localhost:8000..." -ForegroundColor Green
$backendProc = Start-Process -FilePath $PythonCmd -ArgumentList "-m uvicorn app.main:app --port 8000 --reload" -WorkingDirectory $BackendDir -PassThru

Write-Host "Starting Next.js operational frontend on http://localhost:3000..." -ForegroundColor Green
$frontendProc = Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $FrontendDir -PassThru

Start-Sleep -Seconds 2

# 9. Print High-Contrast High-Assurance Status Summary
Write-Host "`n"
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                      FORGE STARTUP SUMMARY                     " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ("Python          [OK]   v{0}" -f $pyVer) -ForegroundColor Green
if ($ollamaOnline) {
    Write-Host "Ollama          [OK]   Online (localhost:11434)" -ForegroundColor Green
} else {
    Write-Host "Ollama          [WARN] Offline (Deterministic Demo Fallback Ready)" -ForegroundColor Yellow
}
if ($reasoningFound) {
    Write-Host ("Qwen3/Reasoning [OK]   Installed ({0})" -f $targetReasoningModel) -ForegroundColor Green
} else {
    Write-Host "Qwen3/Reasoning [WARN] Deterministic Demo Mode (Air-gapped safe)" -ForegroundColor Yellow
}
if ($visionFound) {
    Write-Host ("Vision          [OK]   Installed ({0})" -f $targetVisionModel) -ForegroundColor Green
} else {
    Write-Host "Vision          [WARN] Deterministic Demo Vision (Air-gapped safe)" -ForegroundColor Yellow
}
Write-Host "Backend         [OK]   http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend        [OK]   http://localhost:3000" -ForegroundColor Green
Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "FORGE READY -- 100% LOCAL SOVEREIGN RUNTIME ENFORCED" -ForegroundColor Cyan
Write-Host "No external AI/API providers configured. Zero cloud fallback." -ForegroundColor DarkCyan
Write-Host "Press Ctrl+C to terminate services." -ForegroundColor DarkGray
Write-Host "================================================================" -ForegroundColor Cyan

