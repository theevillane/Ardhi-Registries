#!/bin/bash

# Ardhi Registries - MVP Setup Script
# This script sets up the complete development environment

set -e  # Exit on any error

echo "🚀 Setting up Ardhi Registries MVP..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Check if MongoDB is installed
check_mongodb() {
    print_status "Checking MongoDB installation..."
    if command -v mongod &> /dev/null; then
        print_success "MongoDB is installed"
    else
        print_warning "MongoDB is not installed. Please install MongoDB from https://www.mongodb.com/try/download/community"
        print_warning "Or use MongoDB Atlas (cloud) and update the MONGODB_URI in .env"
    fi
}

# Check if Truffle is installed
check_truffle() {
    print_status "Checking Truffle installation..."
    if command -v truffle &> /dev/null; then
        TRUFFLE_VERSION=$(truffle version | head -n 1)
        print_success "Truffle is installed: $TRUFFLE_VERSION"
    else
        print_warning "Truffle is not installed globally. Installing..."
        npm install -g truffle
        print_success "Truffle installed successfully"
    fi
}

# Check if Ganache is available
check_ganache() {
    print_status "Checking Ganache availability..."
    if command -v ganache-cli &> /dev/null; then
        print_success "Ganache CLI is available"
    else
        print_warning "Ganache CLI is not installed. Installing..."
        npm install -g ganache-cli
        print_success "Ganache CLI installed successfully"
    fi
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    cd Server
    npm install
    cd ..
    print_success "Backend dependencies installed"
}

# Create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    if [ ! -f .env ]; then
        cp env.example .env
        print_success "Environment file created from template"
        print_warning "Please edit .env file with your configuration"
    else
        print_warning ".env file already exists, skipping creation"
    fi
}

# Create logs directory
create_logs_dir() {
    print_status "Creating logs directory..."
    mkdir -p logs
    print_success "Logs directory created"
}

# Compile smart contracts
compile_contracts() {
    print_status "Compiling smart contracts..."
    truffle compile
    print_success "Smart contracts compiled successfully"
}

# Create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Create start-dev.sh
    cat > start-dev.sh << 'EOF'
#!/bin/bash

# Ardhi Registries - Development Startup Script

echo "🚀 Starting Ardhi Registries Development Environment..."
echo "======================================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to start services
start_services() {
    print_status "Starting all services..."
    
    # Start Ganache in background
    print_status "Starting Ganache blockchain..."
    ganache-cli --port 7545 --gasLimit 6721975 --gasPrice 20000000000 > logs/ganache.log 2>&1 &
    GANACHE_PID=$!
    echo $GANACHE_PID > logs/ganache.pid
    sleep 5
    
    # Deploy contracts
    print_status "Deploying smart contracts..."
    truffle migrate --network development > logs/migration.log 2>&1
    
    # Start backend
    print_status "Starting backend server..."
    cd Server
    npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    cd ..
    sleep 3
    
    # Start frontend
    print_status "Starting frontend development server..."
    npm start > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > logs/frontend.pid
    
    print_success "All services started successfully!"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend: http://localhost:3001"
    print_status "Ganache: http://localhost:7545"
    
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for interrupt
    trap 'stop_services' INT
    wait
}

# Function to stop services
stop_services() {
    print_status "Stopping all services..."
    
    if [ -f logs/frontend.pid ]; then
        kill $(cat logs/frontend.pid) 2>/dev/null || true
        rm logs/frontend.pid
    fi
    
    if [ -f logs/backend.pid ]; then
        kill $(cat logs/backend.pid) 2>/dev/null || true
        rm logs/backend.pid
    fi
    
    if [ -f logs/ganache.pid ]; then
        kill $(cat logs/ganache.pid) 2>/dev/null || true
        rm logs/ganache.pid
    fi
    
    print_success "All services stopped"
    exit 0
}

start_services
EOF

    chmod +x start-dev.sh
    
    # Create stop-dev.sh
    cat > stop-dev.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Ardhi Registries Development Environment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_status "Stopping all services..."

if [ -f logs/frontend.pid ]; then
    kill $(cat logs/frontend.pid) 2>/dev/null || true
    rm logs/frontend.pid
    print_status "Frontend stopped"
fi

if [ -f logs/backend.pid ]; then
    kill $(cat logs/backend.pid) 2>/dev/null || true
    rm logs/backend.pid
    print_status "Backend stopped"
fi

if [ -f logs/ganache.pid ]; then
    kill $(cat logs/ganache.pid) 2>/dev/null || true
    rm logs/ganache.pid
    print_status "Ganache stopped"
fi

print_success "All services stopped"
EOF

    chmod +x stop-dev.sh
    
    print_success "Startup scripts created"
}

# Create test script
create_test_script() {
    print_status "Creating MVP test script..."
    
    cat > test-mvp.js << 'EOF'
const Web3 = require('web3');
const axios = require('axios');

// Test configuration
const GANACHE_URL = 'http://localhost:7545';
const BACKEND_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Test functions
async function testWeb3Connection() {
    logInfo('Testing Web3 connection...');
    try {
        const web3 = new Web3(GANACHE_URL);
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
            logSuccess(`Web3 connected. Found ${accounts.length} accounts`);
            return { web3, accounts };
        } else {
            throw new Error('No accounts found');
        }
    } catch (error) {
        logError(`Web3 connection failed: ${error.message}`);
        return null;
    }
}

async function testBackendAPI() {
    logInfo('Testing backend API...');
    try {
        const response = await axios.get(`${BACKEND_URL}/health`);
        if (response.data.success) {
            logSuccess('Backend API is running');
            return true;
        } else {
            throw new Error('Backend health check failed');
        }
    } catch (error) {
        logError(`Backend API test failed: ${error.message}`);
        return false;
    }
}

async function testSmartContract() {
    logInfo('Testing smart contract deployment...');
    try {
        const web3 = new Web3(GANACHE_URL);
        const accounts = await web3.eth.getAccounts();
        
        // Check if contract is deployed (you'll need to update this with actual contract address)
        const contractAddress = process.env.CONTRACT_ADDRESS || '0x...';
        
        if (contractAddress && contractAddress !== '0x...') {
            const code = await web3.eth.getCode(contractAddress);
            if (code !== '0x') {
                logSuccess('Smart contract is deployed');
                return true;
            }
        }
        
        logWarning('Smart contract not deployed or address not configured');
        return false;
    } catch (error) {
        logError(`Smart contract test failed: ${error.message}`);
        return false;
    }
}

async function testUserRegistration() {
    logInfo('Testing user registration...');
    try {
        const testUser = {
            name: 'Test User',
            email: 'test@example.com',
            contact: '+1234567890',
            address: 'Test Address',
            city: 'Test City',
            postalCode: '12345',
            walletAddress: '0x1234567890123456789012345678901234567890'
        };
        
        const response = await axios.post(`${BACKEND_URL}/signup`, testUser);
        if (response.data.success) {
            logSuccess('User registration test passed');
            return response.data.token;
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
            logSuccess('User registration test passed (user already exists)');
            return 'test-token';
        }
        logError(`User registration test failed: ${error.message}`);
        return null;
    }
}

async function testLandRegistration(token) {
    if (!token) {
        logWarning('Skipping land registration test (no token)');
        return false;
    }
    
    logInfo('Testing land registration...');
    try {
        const testLand = {
            landAddress: 'Test Land Address',
            price: 100000,
            description: 'Test land description',
            area: 1000
        };
        
        const response = await axios.post(`${BACKEND_URL}/land/register`, testLand, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
            logSuccess('Land registration test passed');
            return true;
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {
        logError(`Land registration test failed: ${error.message}`);
        return false;
    }
}

// Main test function
async function runTests() {
    log('🧪 Starting Ardhi Registries MVP Tests...', 'bright');
    log('==========================================', 'bright');
    
    const results = {
        web3: false,
        backend: false,
        contract: false,
        registration: false,
        landRegistration: false
    };
    
    // Run tests
    const web3Result = await testWeb3Connection();
    results.web3 = !!web3Result;
    
    results.backend = await testBackendAPI();
    results.contract = await testSmartContract();
    
    const token = await testUserRegistration();
    results.registration = !!token;
    
    results.landRegistration = await testLandRegistration(token);
    
    // Print results
    log('\n📊 Test Results:', 'bright');
    log('================', 'bright');
    
    Object.entries(results).forEach(([test, passed]) => {
        if (passed) {
            logSuccess(`${test}: PASSED`);
        } else {
            logError(`${test}: FAILED`);
        }
    });
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`, 'bright');
    
    if (passedTests === totalTests) {
        logSuccess('🎉 All tests passed! MVP is ready!');
    } else {
        logWarning('⚠️  Some tests failed. Please check the issues above.');
    }
    
    return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };
EOF

    print_success "MVP test script created"
}

# Main setup function
main() {
    print_status "Starting Ardhi Registries MVP setup..."
    
    # Check prerequisites
    check_node
    check_npm
    check_mongodb
    check_truffle
    check_ganache
    
    # Install dependencies
    install_frontend_deps
    install_backend_deps
    
    # Setup configuration
    create_env_file
    create_logs_dir
    
    # Compile contracts
    compile_contracts
    
    # Create scripts
    create_startup_scripts
    create_test_script
    
    print_success "🎉 Setup completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Edit .env file with your configuration"
    echo "2. Start MongoDB (if using local instance)"
    echo "3. Run ./start-dev.sh to start all services"
    echo "4. Run node test-mvp.js to test the MVP"
    echo ""
    print_status "For more information, see README.md"
}

# Run main function
main "$@"