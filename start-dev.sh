#!/bin/bash

# Ardhi Registries Development Start Script
# This script starts all development services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to cleanup on exit
cleanup() {
    print_info "Shutting down services..."
    if [ ! -z "$GANACHE_PID" ]; then
        kill $GANACHE_PID 2>/dev/null || true
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    print_status "All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🏠 Starting Ardhi Registries Development Environment"
echo "=================================================="

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found. Please run ./setup.sh first"
    exit 1
fi

# Start Ganache
print_info "Starting Ganache..."
ganache-cli --port 7545 --gasLimit 6721975 --gasPrice 20000000000 --accounts 10 --defaultBalanceEther 100 &
GANACHE_PID=$!

# Wait for Ganache to start
print_info "Waiting for Ganache to start..."
sleep 5

# Deploy contracts
print_info "Deploying smart contracts..."
npx truffle migrate --network development --reset

# Start backend
print_info "Starting backend server..."
cd Server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
print_info "Waiting for backend to start..."
sleep 3

# Start frontend
print_info "Starting frontend..."
npm start &
FRONTEND_PID=$!

print_status "All services started successfully!"
echo ""
print_info "Services running:"
echo "- Ganache: http://localhost:7545 (PID: $GANACHE_PID)"
echo "- Backend: http://localhost:3001 (PID: $BACKEND_PID)"
echo "- Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
print_info "Press Ctrl+C to stop all services"

# Wait for any process to exit
wait
