const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/, 'Please enter a valid email address'],
  },
  contact: { 
    type: String, 
    required: [true, 'Contact number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid contact number']
  },
  address: { 
    type: String, 
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  city: { 
    type: String, 
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City name cannot exceed 50 characters']
  },
  postalCode: { 
    type: String, 
    required: [true, 'Postal code is required'],
    trim: true,
    match: [/^[0-9]{5,6}$/, 'Please enter a valid postal code']
  },
  role: { 
    type: String, 
    enum: ['user', 'government'], 
    default: 'user' 
  },
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    unique: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid Ethereum wallet address']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
