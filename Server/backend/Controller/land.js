const express = require("express");
const router = express.Router();
const Land = require("../Model/Land");
const User = require("../Model/User");
const config = require("../Config/db_config");
const { Web3 } = require('web3');

// Initialize Web3
const web3 = new Web3(config.ETHEREUM_RPC_URL || 'http://localhost:7545');

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Input validation middleware
const validateLandInput = (req, res, next) => {
  const { landAddress, price, description, area } = req.body;
  
  if (!landAddress || !price || !description || !area) {
    return res.status(400).json({
      success: false,
      message: "Land address, price, description, and area are required"
    });
  }

  if (price <= 0) {
    return res.status(400).json({
      success: false,
      message: "Price must be greater than 0"
    });
  }

  if (area <= 0) {
    return res.status(400).json({
      success: false,
      message: "Area must be greater than 0"
    });
  }

  next();
};

// Register new land
router.post("/register", authenticateToken, validateLandInput, async (req, res) => {
  try {
    const { landAddress, price, description, area, ipfsHash, landDetails } = req.body;
    const userId = req.user.userId;
    const walletAddress = req.user.walletAddress;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if land address already exists
    const existingLand = await Land.findOne({ landAddress });
    if (existingLand) {
      return res.status(400).json({
        success: false,
        message: "Land with this address already exists"
      });
    }

    // Get next land ID (in production, this should be handled by the smart contract)
    const lastLand = await Land.findOne().sort({ landId: -1 });
    const landId = lastLand ? lastLand.landId + 1 : 1;

    const newLand = new Land({
      landId,
      owner: userId,
      ownerWalletAddress: walletAddress,
      ipfsHash: ipfsHash || "",
      landAddress,
      price,
      description,
      area,
      landDetails: landDetails || {},
      governmentApproval: "Pending",
      availability: "Not Available"
    });

    const savedLand = await newLand.save();

    res.status(201).json({
      success: true,
      message: "Land registered successfully",
      land: {
        landId: savedLand.landId,
        landAddress: savedLand.landAddress,
        price: savedLand.price,
        governmentApproval: savedLand.governmentApproval,
        availability: savedLand.availability
      }
    });

  } catch (error) {
    console.error("Error in land registration:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get user's lands
router.get("/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is requesting their own lands or is a government official
    if (req.user.userId !== userId && req.user.role !== 'government') {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const lands = await Land.find({ owner: userId })
      .populate('owner', 'name email walletAddress')
      .populate('requester', 'name email walletAddress')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      lands
    });

  } catch (error) {
    console.error("Error fetching user lands:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get all available lands
router.get("/available", async (req, res) => {
  try {
    const { page = 1, limit = 10, minPrice, maxPrice, state, city } = req.query;
    
    const query = {
      governmentApproval: "Approved",
      availability: "Available",
      isActive: true
    };

    // Add price filters
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Add location filters
    if (state) {
      query['landDetails.state'] = new RegExp(state, 'i');
    }
    if (city) {
      query['landDetails.city'] = new RegExp(city, 'i');
    }

    const lands = await Land.find(query)
      .populate('owner', 'name email walletAddress')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Land.countDocuments(query);

    res.status(200).json({
      success: true,
      lands,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error("Error fetching available lands:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get land details by ID
router.get("/:landId", async (req, res) => {
  try {
    const { landId } = req.params;

    const land = await Land.findOne({ landId })
      .populate('owner', 'name email walletAddress contact')
      .populate('requester', 'name email walletAddress contact');

    if (!land) {
      return res.status(404).json({
        success: false,
        message: "Land not found"
      });
    }

    res.status(200).json({
      success: true,
      land
    });

  } catch (error) {
    console.error("Error fetching land details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Request land purchase
router.post("/request/:landId", authenticateToken, async (req, res) => {
  try {
    const { landId } = req.params;
    const userId = req.user.userId;
    const walletAddress = req.user.walletAddress;

    const land = await Land.findOne({ landId });
    if (!land) {
      return res.status(404).json({
        success: false,
        message: "Land not found"
      });
    }

    // Check if user is the owner
    if (land.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot request your own land"
      });
    }

    // Check if land is available
    if (land.availability !== "Available" || land.governmentApproval !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Land is not available for purchase"
      });
    }

    // Check if there's already a pending request
    if (land.requester) {
      return res.status(400).json({
        success: false,
        message: "Land already has a pending request"
      });
    }

    // Update land with request
    land.requester = userId;
    land.requesterWalletAddress = walletAddress;
    land.availability = "Requested";
    land.requestStatus = "Pending";

    await land.save();

    res.status(200).json({
      success: true,
      message: "Land purchase request submitted successfully"
    });

  } catch (error) {
    console.error("Error requesting land:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Process land request (approve/reject)
router.post("/process-request/:landId", authenticateToken, async (req, res) => {
  try {
    const { landId } = req.params;
    const { status } = req.body; // "Approved" or "Rejected"
    const userId = req.user.userId;

    if (!status || !["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'Approved' or 'Rejected'"
      });
    }

    const land = await Land.findOne({ landId });
    if (!land) {
      return res.status(404).json({
        success: false,
        message: "Land not found"
      });
    }

    // Check if user is the owner
    if (land.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only land owner can process requests"
      });
    }

    // Check if there's a pending request
    if (land.requestStatus !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "No pending request to process"
      });
    }

    // Update land status
    land.requestStatus = status;
    if (status === "Approved") {
      land.availability = "Approved for Purchase";
    } else {
      land.availability = "Available";
      land.requester = null;
      land.requesterWalletAddress = null;
    }

    await land.save();

    res.status(200).json({
      success: true,
      message: `Land request ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error("Error processing land request:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Government approval functions
router.post("/approve/:landId", authenticateToken, async (req, res) => {
  try {
    const { landId } = req.params;
    const { approvalStatus } = req.body; // "Approved" or "Rejected"

    // Check if user is government official
    if (req.user.role !== 'government') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Government role required."
      });
    }

    if (!approvalStatus || !["Approved", "Rejected"].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid approval status. Must be 'Approved' or 'Rejected'"
      });
    }

    const land = await Land.findOne({ landId });
    if (!land) {
      return res.status(404).json({
        success: false,
        message: "Land not found"
      });
    }

    // Update approval status
    land.governmentApproval = approvalStatus;
    if (approvalStatus === "Approved") {
      land.availability = "Available";
    } else {
      land.availability = "Not Available";
    }

    await land.save();

    res.status(200).json({
      success: true,
      message: `Land ${approvalStatus.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error("Error approving land:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get pending approval lands (government only)
router.get("/pending-approval", authenticateToken, async (req, res) => {
  try {
    // Check if user is government official
    if (req.user.role !== 'government') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Government role required."
      });
    }

    const lands = await Land.find({ 
      governmentApproval: "Pending",
      isActive: true 
    })
      .populate('owner', 'name email walletAddress contact')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      lands
    });

  } catch (error) {
    console.error("Error fetching pending lands:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Update land details
router.put("/:landId", authenticateToken, async (req, res) => {
  try {
    const { landId } = req.params;
    const { price, description } = req.body;
    const userId = req.user.userId;

    const land = await Land.findOne({ landId });
    if (!land) {
      return res.status(404).json({
        success: false,
        message: "Land not found"
      });
    }

    // Check if user is the owner
    if (land.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only land owner can update details"
      });
    }

    // Update fields
    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be greater than 0"
        });
      }
      land.price = price;
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty"
        });
      }
      land.description = description;
    }

    await land.save();

    res.status(200).json({
      success: true,
      message: "Land details updated successfully",
      land: {
        landId: land.landId,
        price: land.price,
        description: land.description
      }
    });

  } catch (error) {
    console.error("Error updating land:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get land statistics
router.get("/stats/overview", authenticateToken, async (req, res) => {
  try {
    const stats = await Land.aggregate([
      {
        $group: {
          _id: null,
          totalLands: { $sum: 1 },
          totalValue: { $sum: "$price" },
          approvedLands: {
            $sum: { $cond: [{ $eq: ["$governmentApproval", "Approved"] }, 1, 0] }
          },
          pendingLands: {
            $sum: { $cond: [{ $eq: ["$governmentApproval", "Pending"] }, 1, 0] }
          },
          availableLands: {
            $sum: { $cond: [{ $eq: ["$availability", "Available"] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        totalLands: 0,
        totalValue: 0,
        approvedLands: 0,
        pendingLands: 0,
        availableLands: 0
      }
    });

  } catch (error) {
    console.error("Error fetching land stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;
