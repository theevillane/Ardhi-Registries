require('dotenv').config();

module.exports = {
  email: process.env.EMAIL || "admin@ardhi-registries.com",
  password: process.env.EMAIL_PASSWORD || "your-email-password",
  NEXMO_API_KEY: process.env.NEXMO_API_KEY || "your-nexmo-key",
  NEXMO_API_SECRET: process.env.NEXMO_API_SECRET || "your-nexmo-secret",
  NEXMO_FROM_NUMBER: process.env.NEXMO_FROM_NUMBER || "+1234567890",
  MongoURI: process.env.MONGODB_URI || "mongodb://localhost:27017/ardhi-registries",
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key",
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development"
};
