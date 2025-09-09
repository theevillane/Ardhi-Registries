#!/bin/bash

# Ardhi Registries Setup Script
# This script sets up the development environment for the Ardhi Registries project

set -e

echo "🏠 Setting up Ardhi Registries - Decentralized Land Registry System"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        exit 1
    fi
}

# Check if MongoDB is installed
check_mongodb() {
    if command -v mongod &> /dev/null; then
        print_status "MongoDB is installed"
    else
        print_warning "MongoDB is not installed. Please install MongoDB or use MongoDB Atlas."
        print_info "You can install MongoDB from: https://docs.mongodb.com/manual/installation/"
    fi
}

# Check if Ganache is installed
check_ganache() {
    if command -v ganache-cli &> /dev/null; then
        print_status "Ganache CLI is installed"
    else
        print_warning "Ganache CLI is not installed. Installing globally..."
        npm install -g ganache-cli
        print_status "Ganache CLI installed"
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing frontend dependencies..."
    npm install
    
    print_info "Installing backend dependencies..."
    cd Server
    npm install
    cd ..
    
    print_status "All dependencies installed"
}

# Setup environment file
setup_environment() {
    if [ ! -f .env ]; then
        print_info "Creating .env file from template..."
        cp env.example .env
        print_warning "Please edit .env file with your configuration"
    else
        print_status ".env file already exists"
    fi
}

# Compile smart contracts
compile_contracts() {
    print_info "Compiling smart contracts..."
    npx truffle compile
    print_status "Smart contracts compiled"
}

# Start services
start_services() {
    print_info "Starting development services..."
    
    # Start MongoDB (if available)
    if command -v mongod &> /dev/null; then
        print_info "Starting MongoDB..."
        mongod --fork --logpath /tmp/mongodb.log
    fi
    
    # Start Ganache
    print_info "Starting Ganache..."
    ganache-cli --port 7545 --gasLimit 6721975 --gasPrice 20000000000 --accounts 10 --defaultBalanceEther 100 &
    GANACHE_PID=$!
    
    # Wait for Ganache to start
    sleep 5
    
    # Deploy contracts
    print_info "Deploying smart contracts..."
    npx truffle migrate --network development
    
    print_status "All services started"
    print_info "Ganache PID: $GANACHE_PID"
    print_info "You can stop Ganache with: kill $GANACHE_PID"
}

# Main setup function
main() {
    echo "Starting setup process..."
    
    check_node
    check_mongodb
    check_ganache
    install_dependencies
    setup_environment
    compile_contracts
    
    echo ""
    print_status "Setup completed successfully!"
    echo ""
    print_info "Next steps:"
    echo "1. Edit .env file with your configuration"
    echo "2. Start the backend: cd Server && npm run dev"
    echo "3. Start the frontend: npm start"
    echo "4. Open http://localhost:3000 in your browser"
    echo ""
    print_info "To start all services at once, run: ./start-dev.sh"
}

# Run main function
main "$@"
