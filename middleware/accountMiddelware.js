const { validateAddress } = require("../utils/helper");
const User = require("../models/User");

// Middleware to validate wallet address and check if account exists
const accountMiddleware =  async (req, res, next) => {
    const { walletAddress } = req.params;
    if (!validateAddress(walletAddress)) return res.status(401).json({ message: "Invalid Wallet Address" });
    try {
        const account =  await User.findOne({ walletAddress });
        if (!account) return res.status(404).json({ message: "User not found" });
        req.user = account;
        next();
    } catch (error) {
        res.status(500).json({ message: "Error creating user" });
    }
};

module.exports = accountMiddleware;