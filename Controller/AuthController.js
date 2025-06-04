require("dotenv").config();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validateAddress } = require("../utils/helper");

exports.login = async (req, res) => {
  const { walletAddress } = req.body;
  if (!validateAddress(walletAddress)) return res.status(401).json({ message: "Invalid Wallet Address" });
  if (!walletAddress) return res.status(400).json({ message: "Wallet address is required" });
  try {
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ message: "User not found" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({
      access_token: token,
      user: { username: user.username, walletAddress: user.walletAddress },
      token_type: "bearer", message: "Login successful"
    });
  } catch (err) {
    res.status(500).json({ message: "Error logging in" + err });
  }
}
exports.login2 = async (req, res) => {
  res.json({
    access_token: 'token',
    // user: { username: user.username, walletAddress: user.walletAddress },
    token_type: "bearer", message: "Login successful"
  });
  const { walletAddress } = req.body;
  if (!validateAddress(walletAddress)) return res.status(401).json({ message: "Invalid Wallet Address" });
  if (!walletAddress) return res.status(400).json({ message: "Wallet address is required" });
  try {
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ message: "User not found" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({
      access_token: token,
      user: { username: user.username, walletAddress: user.walletAddress },
      token_type: "bearer", message: "Login successful"
    });
  } catch (err) {
    res.status(500).json({ message: "Error logging in" + err });
  }
}

// // Create Account
exports.createAccount = async (req, res) => {
  const { walletAddress } = req.body;
  if (!validateAddress(walletAddress)) return res.status(401).json({ message: "Invalid Wallet Address" });
  if (!walletAddress) return res.status(400).json({ message: "Wallet address is required" });

  // check if wallet address is valid or already exists

  const accountExists = await User.findOne({ walletAddress });
  if (accountExists) return res.status(200).json({ message: "Account already exists" });
  const payload = {
    username: `${walletAddress.slice(0, 7)}...${walletAddress.slice(-5)}`,
    walletAddress,
    isActive: false,
    role: "user",
    status: "active",
    createdAt: Date.now(),
  };
  try {
    const user = new User(payload);
    await user.save();
    // res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Error creating account" + err });
  }
}

// Get Account info
exports.getAccount = async (req, res) => {
  const { walletAddress } = req.params;
  try {
    const account = await User.findOne({ walletAddress });
    if (!account) return res.status(404).json({ message: "Account not found" });
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: "Error getting account info" });
  }
}

//get all user
exports.getAllUser = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({ message: users });
  } catch (err) {
    res.status(500).json({ message: err });
  }
}