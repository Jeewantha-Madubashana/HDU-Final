# Start script for HDU Final Project
# This script starts both the client and server concurrently

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "HDU Final Project - Starting Services" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exist
if (-not (Test-Path "node_modules")) {
    Write-Host "Root dependencies not found. Running setup..." -ForegroundColor Yellow
    .\setup.ps1
}

if (-not (Test-Path "client\node_modules")) {
    Write-Host "Client dependencies not found. Installing..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
}

if (-not (Test-Path "server\node_modules")) {
    Write-Host "Server dependencies not found. Installing..." -ForegroundColor Yellow
    Set-Location server
    npm install
    Set-Location ..
}

# Check if concurrently is installed
if (-not (Test-Path "node_modules\concurrently")) {
    Write-Host "Installing concurrently..." -ForegroundColor Blue
    npm install
}

Write-Host "Starting client and server..." -ForegroundColor Green
Write-Host ""

# Start both services
npm run dev

