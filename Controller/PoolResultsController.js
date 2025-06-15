const PoolResults = require("../models/PoolResults");
const { logger } = require("../logger");
const { superAdminWalletAddress } = require("../config");
// create a pool result
exports.createPoolResult = async (req, res) => {
    const { pool_id, pool_porcessing_id, order_id, symbol, user_id, walletAddress,
        amount, calimable_amount, profit_loss, expiry_time } = req.body;
    const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to create a pool result" });
    }
    try {
        const payload = {
            pool_id, pool_porcessing_id, order_id, symbol, user_id, walletAddress,
            amount, calimable_amount, profit_loss, expiry_time, createdBy,
            isClaimed: false, isExpired: false, status: "IDLE"
        }
        const poolResult = new PoolResults(payload);
        await poolResult.save();
        res.status(201).json({ message: "Pool result created successfully" });
    } catch (err) {
        logger.error("Error creating pool result: ", err);
        res.status(500).json({ message: "Error creating pool result" });
    }
}
// get all pool results
exports.getPoolResults = async (req, res) => {
     const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to get pool results" });
    }
    try {
        const poolResults = await PoolResults.find({ createdBy });
        if (!poolResults || poolResults.length === 0)
            return res.status(404).json({ message: "Pool results not found" });
        // Check if the pool results belong to the user
        res.status(200).json({ message: poolResults });
    } catch (err) {
        logger.error("Error getting pool results: ", err);
        res.status(500).json({ message: "Error getting pool results" });
    }
}
// get pool result by id
exports.getPoolResultById = async (req, res) => {
    const { id } = req.params;
     const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to get a pool result" });
    }
    try {
        const poolResult = await PoolResults.findById(id);
        if (!poolResult) return res.status(404).json({ message: "Pool result not found" });
        res.status(200).json({ message: poolResult });
    } catch (err) {
        logger.error("Error getting pool result: ", err);
        res.status(500).json({ message: "Error getting pool result" });
    }
}
// update pool result
exports.updatePoolResult = async (req, res) => {
    const { id } = req.params;
    const { amount, calimable_amount, profit_loss,
        expiry_time, isClaimed, isExpired, status
    } = req.body;
     const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to update a pool result" });
    }
    try {
        if (!id) return res.status(400).json({ message: "Pool result ID is required" });
        // check if createdBy matches the user
        const poolResult = await PoolResults.findById(id);
        if (!poolResult) return res.status(404).json({ message: "Pool result not found" });
        if (poolResult.createdBy.toString() !== createdBy.toString()) {
            return res.status(403).json({ message: "You do not have permission to update this pool result" });
        }
        // update the pool result
        const payload = {
            amount, calimable_amount, profit_loss,
            expiry_time, isClaimed, isExpired, status
        }
        const newPoolResult = await PoolResults.findByIdAndUpdate(id, payload, { new: true });
        if (!newPoolResult) return res.status(404).json({ message: "Pool result not found" });
        res.status(200).json({ message: "Pool result updated successfully", poolResult: newPoolResult });
    } catch (err) {
        logger.error("Error updating pool result: ", err);
        res.status(500).json({ message: "Error updating pool result" });
    }
}

// delete pool result
exports.deletePoolResult = async (req, res) => {
    const { id } = req.params;
     const { walletAddress: createdBy } = req.user;
        if (createdBy != superAdminWalletAddress) {
            return res.status(403).json({ message: "You do not have permission to delete a pool result" });
        }
    try {
        if (!id) return res.status(400).json({ message: "Pool result ID is required" });
        // check if createdBy matches the user
        const poolResult = await PoolResults.findById(id);
        if (!poolResult) return res.status(404).json({ message: "Pool result not found" });
        if (poolResult.createdBy.toString() !== createdBy.toString()) {
            return res.status(403).json({ message: "You do not have permission to update this pool result" });
        }
        await PoolResults.findByIdAndDelete(id);
        res.status(200).json({ message: "Pool result deleted successfully" });
    } catch (err) {
        logger.error("Error deleting pool result: ", err);
        res.status(500).json({ message: "Error deleting pool result" });
    }
}

// *** get all pool results by user id
exports.getPoolResultsByUserId = async (req, res) => {
    const { _id: user_id, walletAddress } = req.user;
    try {
        const poolResults = await PoolResults.find({ user_id, walletAddress });
        if (!poolResults) return res.status(404).json({ message: "Pool results not found" });
        res.status(200).json({ results: poolResults });
    } catch (err) {
        logger.error("Error getting pool results: ", err);
        res.status(500).json({ message: "Error getting pool results" });
    }
}

// get all pool results by pool id
exports.getPoolResultsByPoolId = async (req, res) => {
    const { pool_id } = req.params;
     const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to get a pool result" });
    }
    try {
        const poolResults = await PoolResults.find({ pool_id, createdBy });
        if (!poolResults) return res.status(404).json({ message: "Pool results not found" });
        res.status(200).json({ message: poolResults });
    } catch (err) {
        logger.error("Error getting pool results: ", err);
        res.status(500).json({ message: "Error getting pool results" });
    }
}
// get all pool results by pool processing id
exports.getPoolResultsByPoolProcessingId = async (req, res) => {
    const { pool_processing_id } = req.params;
     const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to get a pool results" });
    }
    try {
        const poolResults = await PoolResults.find({ pool_processing_id, createdBy });
        if (!poolResults) return res.status(404).json({ message: "Pool results not found" });
        res.status(200).json({ message: poolResults });
    } catch (err) {
        logger.error("Error getting pool results: ", err);
        res.status(500).json({ message: "Error getting pool results" });
    }
}
// get all pool results by symbol
exports.getPoolResultsBySymbol = async (req, res) => {
    const { symbol } = req.params;
    const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to get a pool results" });
    }
    try {
        const poolResults = await PoolResults.find({ symbol, createdBy });
        if (!poolResults) return res.status(404).json({ message: "Pool results not found" });
        res.status(200).json({ message: poolResults });
    } catch (err) {
        logger.error("Error getting pool results: ", err);
        res.status(500).json({ message: "Error getting pool results" });
    }
}