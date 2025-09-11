require('dotenv').config();

module.exports = {
  // Email Configuration
  email: process.env.EMAIL || "admin@ardhi-registries.com",
  password: process.env.EMAIL_PASSWORD || "your-email-password",
  
  // SMS Configuration (Nexmo/Vonage)
  NEXMO_API_KEY: process.env.NEXMO_API_KEY || "your-nexmo-key",
  NEXMO_API_SECRET: process.env.NEXMO_API_SECRET || "your-nexmo-secret",
  NEXMO_FROM_NUMBER: process.env.NEXMO_FROM_NUMBER || "+1234567890",
  
  // Database Configuration
  MongoURI: process.env.MONGODB_URI || "mongodb://localhost:27017/ardhi-registries",
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key",
  
  // Server Configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  
  // Blockchain Configuration
  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || "http://localhost:7545",
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || "",
  PRIVATE_KEY: process.env.PRIVATE_KEY || "",
  
  // IPFS Configuration
  IPFS_GATEWAY_URL: process.env.IPFS_GATEWAY_URL || "https://ipfs.io/ipfs/",
  IPFS_API_URL: process.env.IPFS_API_URL || "http://localhost:5001",
  
  // Security Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || "image/jpeg,image/png,image/gif,application/pdf",
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  LOG_FILE: process.env.LOG_FILE || "logs/app.log"
};
