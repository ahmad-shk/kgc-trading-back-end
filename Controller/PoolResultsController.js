const PoolResults = require("../models/PoolResults");
const { logger } = require("../logger");

// create a pool result
exports.createPoolResult = async (req, res) => {
    const { pool_id, pool_porcessing_id, symbol, amount, calimable_amount, profit_loss, expiry_time } = req.body;
    const { _id: user_id, walletAddress } = req.user;
    try {
        const payload ={ pool_id, pool_porcessing_id, symbol, user_id, walletAddress, amount, calimable_amount, profit_loss, expiry_time }
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
    try {
        const poolResults = await PoolResults.find({});
        res.status(200).json({ message: poolResults });
    } catch (err) {
        logger.error("Error getting pool results: ", err);
        res.status(500).json({ message: "Error getting pool results" });
    }
}
// get pool result by id
exports.getPoolResultById = async (req, res) => {
    const { id } = req.params;
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
    const { amount, calimable_amount, profit_loss, expiry_time } = req.body;
    try {
        const poolResult = await PoolResults.findByIdAndUpdate(id, { amount, calimable_amount, profit_loss, expiry_time }, { new: true });
        if (!poolResult) return res.status(404).json({ message: "Pool result not found" });
        res.status(200).json({ message: "Pool result updated successfully", poolResult });
    } catch (err) {
        logger.error("Error updating pool result: ", err);
        res.status(500).json({ message: "Error updating pool result" });
    }
}

// delete pool result
exports.deletePoolResult = async (req, res) => {
    const { id } = req.params;
    try {
        const poolResult = await PoolResults.findByIdAndDelete(id);
        if (!poolResult) return res.status(404).json({ message: "Pool result not found" });
        res.status(200).json({ message: "Pool result deleted successfully" });
    } catch (err) {
        logger.error("Error deleting pool result: ", err);
        res.status(500).json({ message: "Error deleting pool result" });
    }
}

// get all pool results by user id
exports.getPoolResultsByUserId = async (req, res) => {
     const { _id: user_id, walletAddress } = req.user;
    try {
        const poolResults = await PoolResults.find({ user_id, walletAddress });
        if (!poolResults) return res.status(404).json({ message: "Pool results not found" });
        res.status(200).json({ message: poolResults });
    } catch (err) {
        logger.error("Error getting pool results: ", err);
        res.status(500).json({ message: "Error getting pool results" });
    }
}
// get all pool results by pool id
exports.getPoolResultsByPoolId = async (req, res) => {
    const { pool_id } = req.params;
    try {
        const poolResults = await PoolResults.find({ pool_id });
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
    try {
        const poolResults = await PoolResults.find({ pool_processing_id });
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
    try {
        const poolResults = await PoolResults.find({ symbol });
        if (!poolResults) return res.status(404).json({ message: "Pool results not found" });
        res.status(200).json({ message: poolResults });
    } catch (err) {
        logger.error("Error getting pool results: ", err);
        res.status(500).json({ message: "Error getting pool results" });
    }
}
// get all pool results by wallet address