# Setup script for HDU Final Project
# This script installs all dependencies for both client and server

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "HDU Final Project - Setup Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Blue
    Write-Host "npm version: $npmVersion" -ForegroundColor Blue
    Write-Host ""
} catch {
    Write-Host "Error: Node.js is not installed. Please install Node.js first." -ForegroundColor Yellow
    exit 1
}

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Green
npm install

# Install client dependencies
Write-Host ""
Write-Host "Installing client dependencies..." -ForegroundColor Green
Set-Location client
npm install
Set-Location ..

# Install server dependencies
Write-Host ""
Write-Host "Installing server dependencies..." -ForegroundColor Green
Set-Location server
npm install
Set-Location ..

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Configure environment variables in server/.env"
Write-Host "2. Run 'npm run dev' from the root directory to start both client and server"
Write-Host "   Or run './start.ps1' to start both services"
Write-Host ""

