#!/bin/bash

# Start script for HDU Final Project
# This script starts both the client and server concurrently

set -e  # Exit on error

echo "=========================================="
echo "HDU Final Project - Starting Services"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Root dependencies not found. Running setup...${NC}"
    ./setup.sh
fi

if [ ! -d "client/node_modules" ]; then
    echo -e "${YELLOW}Client dependencies not found. Installing...${NC}"
    cd client && npm install && cd ..
fi

if [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}Server dependencies not found. Installing...${NC}"
    cd server && npm install && cd ..
fi

# Check if concurrently is installed
if [ ! -d "node_modules/concurrently" ]; then
    echo -e "${BLUE}Installing concurrently...${NC}"
    npm install
fi

echo -e "${GREEN}Starting client and server...${NC}"
echo ""

# Start both services
npm run dev

