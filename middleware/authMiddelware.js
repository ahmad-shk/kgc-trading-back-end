const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware =  async  (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access Denied" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        // console.log("Verified Token: ", verified);
        const account = await User.findById(verified.id);
        if (!account) return res.status(404).json({ message: "User not found" });
        req.user = account;
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

module.exports = authMiddleware;
