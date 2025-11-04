#!/bin/bash

# Setup script for HDU Final Project
# This script installs all dependencies for both client and server

set -e  # Exit on error

echo "=========================================="
echo "HDU Final Project - Setup Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Error: Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}Error: npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${BLUE}Node.js version:$(node --version)${NC}"
echo -e "${BLUE}npm version:$(npm --version)${NC}"
echo ""

# Install root dependencies
echo -e "${GREEN}Installing root dependencies...${NC}"
npm install

# Install client dependencies
echo ""
echo -e "${GREEN}Installing client dependencies...${NC}"
cd client
npm install
cd ..

# Install server dependencies
echo ""
echo -e "${GREEN}Installing server dependencies...${NC}"
cd server
npm install
cd ..

echo ""
echo -e "${GREEN}=========================================="
echo "Setup completed successfully!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure environment variables in server/.env"
echo "2. Run 'npm run dev' from the root directory to start both client and server"
echo "   Or run './start.sh' to start both services"
echo ""

