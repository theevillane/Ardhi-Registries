const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../Model/User");
const Land = require("../Model/Land");
const config = require("../Config/db_config");
const sms = require("../Api/send_sms");
const mail = require("../Api/send_mail");

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Input validation middleware
const validateUserInput = (req, res, next) => {
  const { name, email, contact, address, city, postalCode, walletAddress } = req.body;
  
  if (!name || !email || !contact || !address || !city || !postalCode || !walletAddress) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  // Email validation
  const emailRegex = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address"
    });
  }

  // Wallet address validation
  const walletRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!walletRegex.test(walletAddress)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid Ethereum wallet address"
    });
  }

  next();
};

// User registration
router.post("/signup", validateUserInput, async (req, res) => {
  try {
    const { name, email, contact, address, city, postalCode, walletAddress } = req.body;

    // Check if user exists by email or wallet address
    const existingUser = await User.findOne({
      $or: [{ email: email }, { walletAddress: walletAddress }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? "User with this email already exists" 
          : "User with this wallet address already exists"
      });
    }

    const newUser = new User({
      name,
      email,
      contact,
      address,
      city,
      postalCode,
      walletAddress,
      role: "user"
    });

    const savedUser = await newUser.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: savedUser._id, 
        email: savedUser.email, 
        role: savedUser.role,
        walletAddress: savedUser.walletAddress
      },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        walletAddress: savedUser.walletAddress,
        role: savedUser.role
      }
    });

  } catch (error) {
    console.error("Error in signup:", error);
    
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

// Government user registration
router.post("/register_govt", async (req, res) => {
  try {
    const { name, email, contact, address, city, postalCode, walletAddress, password } = req.body;

    // Check if government user already exists
    const existingGovt = await User.findOne({ role: "government" });
    if (existingGovt) {
      return res.status(400).json({
        success: false,
        message: "Government user already exists"
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const govtUser = new User({
      name: name || "Government Registrar",
      email: email || "govt@ardhi-registries.com",
      contact: contact || "+254758173305",
      address: address || "1st Ngong Avenue, Ngong Road, NAIROBI",
      city: city || "NAIROBI",
      postalCode: postalCode || "00100",
      walletAddress,
      role: "government",
      password: hashedPassword
    });

    await govtUser.save();

    res.status(201).json({
      success: true,
      message: "Government user registered successfully"
    });

  } catch (error) {
    console.error("Error in government registration:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// User login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated"
      });
    }

    // For government users, check password
    if (user.role === "government" && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        walletAddress: user.walletAddress
      },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, contact, address, city, postalCode } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update fields
    if (name) user.name = name;
    if (contact) user.contact = contact;
    if (address) user.address = address;
    if (city) user.city = city;
    if (postalCode) user.postalCode = postalCode;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get all users (admin only)
router.get("/users", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "government") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Government role required."
      });
    }

    const users = await User.find({ role: "user" }).select('-password');
    res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Send notification
router.post("/send_notification", authenticateToken, async (req, res) => {
  try {
    const { email, message, subject, phoneNumber } = req.body;

    if (!email || !message) {
      return res.status(400).json({
        success: false,
        message: "Email and message are required"
      });
    }

    // Send email
    if (email) {
      await mail.send_mail(email, message, subject || "Ardhi Registries Notification");
    }

    // Send SMS
    if (phoneNumber) {
      await sms.send_sms(phoneNumber, message);
    }

    res.status(200).json({
      success: true,
      message: "Notification sent successfully"
    });

  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send notification"
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
