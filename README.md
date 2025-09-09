# Ardhi Registries - Decentralized Land Registry System

A comprehensive blockchain-based land registry system built on Ethereum, featuring secure smart contracts, modern React frontend, and robust Node.js backend.

## 🌟 Features

### Core Functionality
- **User Registration & Authentication**: Secure user onboarding with wallet integration
- **Land Registration**: Register land properties with IPFS document storage
- **Government Approval**: Government officials can approve/reject land registrations
- **Land Trading**: Secure peer-to-peer land trading with smart contracts
- **Ownership Verification**: Blockchain-based ownership verification
- **Document Management**: IPFS-based document and image storage

### Technical Features
- **Smart Contracts**: Solidity contracts with OpenZeppelin security standards
- **Web3 Integration**: MetaMask wallet integration
- **IPFS Storage**: Decentralized file storage for documents
- **JWT Authentication**: Secure API authentication
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Robust error handling throughout the application
- **Security**: Rate limiting, CORS, helmet security headers

## 🏗️ Architecture

```
├── src/
│   ├── contracts/          # Smart contracts
│   ├── abis/              # Contract ABIs
│   ├── Components/        # React components
│   ├── Containers/        # React containers
│   └── images/            # Static images
├── Server/
│   ├── backend/
│   │   ├── Controller/    # API controllers
│   │   ├── Model/         # Database models
│   │   ├── Config/        # Configuration files
│   │   └── Api/           # External API integrations
│   └── app.js             # Main server file
├── migrations/            # Truffle migrations
└── public/               # Static public files
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Ganache CLI or MetaMask
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ardhi-Registries
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd Server
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB
   mongod
   
   # Or use MongoDB Atlas (update MONGODB_URI in .env)
   ```

5. **Blockchain Setup**
   ```bash
   # Install Truffle globally
   npm install -g truffle
   
   # Start Ganache (in a new terminal)
   ganache-cli
   
   # Compile and migrate contracts
   truffle compile
   truffle migrate
   ```

6. **Start the application**
   ```bash
   # Terminal 1: Start backend
   cd Server
   npm run dev
   
   # Terminal 2: Start frontend
   npm start
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/ardhi-registries

# JWT Secret (change in production)
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration
EMAIL=admin@ardhi-registries.com
EMAIL_PASSWORD=your-email-password

# SMS Configuration
NEXMO_API_KEY=your-nexmo-api-key
NEXMO_API_SECRET=your-nexmo-api-secret
NEXMO_FROM_NUMBER=+1234567890

# Blockchain
ETHEREUM_RPC_URL=http://localhost:7545
CONTRACT_ADDRESS=0x... # Deployed contract address
```

### Smart Contract Deployment

1. **Deploy to local network**
   ```bash
   truffle migrate --network development
   ```

2. **Deploy to testnet**
   ```bash
   truffle migrate --network <testnet-name>
   ```

3. **Update contract address**
   - Copy the deployed contract address
   - Update `CONTRACT_ADDRESS` in `.env`
   - Update the ABI in `src/abis/LandRegistry.json`

## 📱 Usage

### User Flow

1. **Registration**
   - Connect MetaMask wallet
   - Fill registration form
   - Submit to blockchain and database

2. **Land Registration**
   - Upload land documents to IPFS
   - Register land on blockchain
   - Wait for government approval

3. **Government Approval**
   - Government officials review submissions
   - Approve or reject land registrations
   - Update blockchain status

4. **Land Trading**
   - Browse available properties
   - Request to purchase
   - Complete transaction on blockchain

### API Endpoints

#### Authentication
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

#### Land Management
- `POST /api/land/register` - Register new land
- `GET /api/land/user/:userId` - Get user's lands
- `GET /api/land/available` - Get available lands
- `POST /api/land/request/:landId` - Request land purchase
- `POST /api/land/approve/:landId` - Approve land (government)

#### Government
- `GET /api/users` - Get all users (government only)
- `POST /api/land/approve` - Approve land registration
- `POST /api/send_notification` - Send notifications

## 🛡️ Security Features

- **Smart Contract Security**: OpenZeppelin libraries, reentrancy guards
- **Input Validation**: Comprehensive validation on all inputs
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured CORS policies
- **Helmet Security**: Security headers middleware
- **Data Sanitization**: Input sanitization and validation

## 🧪 Testing

### Smart Contract Testing
```bash
# Run contract tests
truffle test
```

### Backend Testing
```bash
cd Server
npm test
```

### Frontend Testing
```bash
npm test
```

## 📦 Deployment

### Backend Deployment

1. **Environment Setup**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export MONGODB_URI=your-production-mongodb-uri
   export JWT_SECRET=your-production-jwt-secret
   ```

2. **Deploy to server**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start app.js --name "ardhi-backend"
   ```

### Frontend Deployment

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Deploy to hosting service**
   - Upload `build/` folder to your hosting service
   - Configure environment variables

### Smart Contract Deployment

1. **Deploy to mainnet**
   ```bash
   truffle migrate --network mainnet
   ```

2. **Verify contracts**
   ```bash
   truffle run verify LandRegistry --network mainnet
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@ardhi-registries.com or create an issue in the repository.

## 🔮 Roadmap

- [ ] Mobile app development
- [ ] Multi-chain support (Polygon, BSC)
- [ ] Advanced analytics dashboard
- [ ] Integration with government databases
- [ ] Automated land valuation
- [ ] NFT-based land certificates

## 📊 Project Status

- ✅ Smart Contracts (Completed)
- ✅ Backend API (Completed)
- ✅ Frontend UI (In Progress)
- ⏳ Testing (Pending)
- ⏳ Deployment (Pending)

---

**Built with ❤️ for transparent and secure land registry management**