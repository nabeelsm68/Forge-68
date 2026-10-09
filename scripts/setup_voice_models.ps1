<#
.SYNOPSIS
    FORGE Sovereign Offline Voice Setup & Model Verification Script.
.DESCRIPTION
    Installs and verifies local multilingual speech recognition (faster-whisper)
    and text-to-speech synthesis (Piper ONNX and Meta MMS Kannada VITS)
    strictly on-premise with zero external cloud dependencies.
#>

param(
    [switch]$SkipDownload = $false,
    [switch]$VerifyOnly = $false
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RepoRoot "backend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
$VenvPip = Join-Path $BackendDir ".venv\Scripts\pip.exe"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  FORGE SOVEREIGN MULTILINGUAL VOICE SETUP AND ACTIVATION " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $VenvPython)) {
    Write-Error "Python 3.12 virtual environment not found at: $VenvPython"
    exit 1
}

Write-Host "[1/4] Checking Python 3.12 Environment..." -ForegroundColor Green
& $VenvPython -V

if (-not $VerifyOnly) {
    Write-Host "`n[2/4] Ensuring Required Sovereign Voice Packages are Installed..." -ForegroundColor Green
    & $VenvPip install -r (Join-Path $BackendDir "requirements.txt")
}

if (-not $SkipDownload -and -not $VerifyOnly) {
    Write-Host "`n[3/4] Checking and Downloading Sovereign Model Files..." -ForegroundColor Green
    & $VenvPython (Join-Path $BackendDir "scripts\download_voice_models.py")
}

Write-Host "`n[4/4] Running Multilingual Synthesis and Transcription Test..." -ForegroundColor Green
& $VenvPython (Join-Path $BackendDir "scripts\verify_voice.py")

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  FORGE SOVEREIGN VOICE PIPELINE FULLY ACTIVATED AND READY" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
