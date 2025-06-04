const PoolProcessing = require("../models/PoolProcessing");
const { logger } = require("../logger");
const { superAdminWalletAddress } = require("../config");
// create a pool processing
exports.createPoolProcessing = async (req, res) => {
    const { pool_id, symbol, random_number, random_start_range,
        random_end_range, ranges, total_users } = req.body;
    const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to create a pool processing" });
    }
    try {
        const payload = {
            pool_id, symbol, random_number, random_start_range,
            random_end_range, ranges, total_users, createdBy
        }
        const poolProcessing = new PoolProcessing(payload);
        await poolProcessing.save();
        res.status(201).json({ message: "Pool processing created successfully" });
    } catch (err) {
        logger.error("Error creating pool processing: ", err);
        res.status(500).json({ message: "Error creating pool processing" });
    }
}
// get pool processing by id
exports.getPoolProcessingById = async (req, res) => {
    const { id: pPoolId } = req.params;
    const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to get a pool processing" });
    }
    try {
        const poolProcessing = await PoolProcessing.findById(pPoolId);
        if (!poolProcessing) return res.status(404).json({ message: "Pool processing not found" });
        if (poolProcessing.createdBy.toString() !== createdBy.toString()) {
            return res.status(403).json({ message: "You do not have permission to access this pool processing" });
        }
        res.status(200).json({ message: poolProcessing });
    }
    catch (err) {
        logger.error("Error getting pool processing: ", err);
        res.status(500).json({ message: "Error getting pool processing" });
    }
}
// update pool processing
exports.updatePoolProcessing = async (req, res) => {
    const { id: pPoolId } = req.params;
    const { random_number, random_start_range, random_end_range, ranges, total_users } = req.body;
    const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to update a pool processing" });
    }
    try {
        // Check if the pool processing exists and belongs to the user
        const poolProcessing = await PoolProcessing.findById(pPoolId);
        if (!poolProcessing) return res.status(404).json({ message: "Pool processing not found" });
        if (poolProcessing.createdBy.toString() !== createdBy.toString()) {
            return res.status(403).json({ message: "You do not have permission to update this pool processing" });
        }
        // Update the pool processing
        const payload = { random_number, random_start_range, random_end_range, ranges, total_users }
        const newPoolProcessing = await PoolProcessing.findByIdAndUpdate(pPoolId, payload, { new: true });
        res.status(200).json({ message: "Pool processing updated successfully", poolProcessing: newPoolProcessing });
    } catch (err) {
        logger.error("Error updating pool processing: ", err);
        res.status(500).json({ message: "Error updating pool processing" });
    }
}
// delete pool processing
exports.deletePoolProcessing = async (req, res) => {
    const { id: pPoolId } = req.params;
    const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to delete a pool processing" });
    }
    try {
        // Check if the pool processing exists and belongs to the user
        const poolProcessing = await PoolProcessing.findById(pPoolId);
        if (!poolProcessing) return res.status(404).json({ message: "Pool processing not found" });
        if (poolProcessing.createdBy.toString() !== createdBy.toString()) {
            return res.status(403).json({ message: "You do not have permission to update this pool processing" });
        }
        const newPoolProcessing = await PoolProcessing.findByIdAndDelete(pPoolId);
        if (!newPoolProcessing) return res.status(404).json({ message: "Pool processing not found" });
        res.status(200).json({ message: "Pool processing deleted successfully" });
    } catch (err) {
        logger.error("Error deleting pool processing: ", err);
        res.status(500).json({ message: "Error deleting pool processing" });
    }
}

// *** get all pool processing
exports.getPoolsInProcessings = async (req, res) => {
    const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to get all pool processing" });
    }
    try {
        const poolProcessings = await PoolProcessing.find({ createdBy });
        res.status(200).json({ message: poolProcessings });
    } catch (err) {
        logger.error("Error getting pool processings: ", err);
        res.status(500).json({ message: "Error getting pool processings" });
    }
}

// get pool processing by pool id
exports.getPoolProcessingByPoolId = async (req, res) => {
    const { pool_id } = req.params;
    const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to get a pool processing" });
    }
    try {
        const poolProcessing = await PoolProcessing.find({ pool_id, createdBy });
        if (!poolProcessing) return res.status(404).json({ message: "Pool processing not found" });
        res.status(200).json({ message: poolProcessing });
    } catch (err) {
        logger.error("Error getting pool processing: ", err);
        res.status(500).json({ message: "Error getting pool processing" });
    }
}

// get pool processing by symbol
exports.getPoolProcessingsBySymbol = async (req, res) => {
    const { symbol } = req.params;
    const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to get a pool processing" });
    }
    try {
        const poolProcessing = await PoolProcessing.find({ symbol, createdBy });
        if (!poolProcessing) return res.status(404).json({ message: "Pool processing not found" });
        res.status(200).json({ message: poolProcessing });
    } catch (err) {
        logger.error("Error getting pool processing: ", err);
        res.status(500).json({ message: "Error getting pool processing" });
    }
}


