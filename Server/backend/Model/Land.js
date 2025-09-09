const mongoose = require('mongoose');

const landSchema = mongoose.Schema({
  landId: {
    type: Number,
    required: true,
    unique: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerWalletAddress: {
    type: String,
    required: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid Ethereum wallet address']
  },
  ipfsHash: {
    type: String,
    required: true,
    unique: true
  },
  landAddress: {
    type: String,
    required: [true, 'Land address is required'],
    trim: true,
    maxlength: [200, 'Land address cannot exceed 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  governmentApproval: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  availability: {
    type: String,
    enum: ['Not Available', 'Available', 'Requested', 'Approved for Purchase'],
    default: 'Not Available'
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  requesterWalletAddress: {
    type: String,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid Ethereum wallet address'],
    default: null
  },
  requestStatus: {
    type: String,
    enum: ['Default', 'Pending', 'Rejected', 'Approved'],
    default: 'Default'
  },
  landDetails: {
    area: {
      type: String,
      required: [true, 'Land area is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required']
    },
    documents: [{
      type: String, // Base64 encoded documents
      required: false
    }],
    images: [{
      type: String, // Base64 encoded images
      required: false
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
landSchema.index({ landId: 1 });
landSchema.index({ owner: 1 });
landSchema.index({ ownerWalletAddress: 1 });
landSchema.index({ governmentApproval: 1 });
landSchema.index({ availability: 1 });
landSchema.index({ requester: 1 });

module.exports = mongoose.model('Land', landSchema);
