const PoolProcessing = require("../models/PoolProcessing");
const { logger } = require("../logger");

// create a pool processing
exports.createPoolProcessing = async (req, res) => {
    const { pool_id, symbol, random_number, random_start_range, random_end_range, ranges, total_users } = req.body;
    const createdBy = req.user.id;
    try {
        const payload = { pool_id, symbol, random_number, random_start_range, random_end_range, ranges, total_users, createdBy }
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
    const {  id: pPoolId } = req.params;
    try {
        const poolProcessing = await PoolProcessing.findById(pPoolId);
        if (!poolProcessing) return res.status(404).json({ message: "Pool processing not found" });
        res.status(200).json({ message: poolProcessing });
    }
    catch (err) {
        logger.error("Error getting pool processing: ", err);
        res.status(500).json({ message: "Error getting pool processing" });
    } 
}
// update pool processing
exports.updatePoolProcessing = async (req, res) => {
    const {  id: pPoolId } = req.params;
    const { random_number, random_start_range, random_end_range, ranges, total_users } = req.body;
    try {
        const poolProcessing = await PoolProcessing.findByIdAndUpdate(pPoolId, { random_number, random_start_range, random_end_range, ranges, total_users }, { new: true });
        if (!poolProcessing) return res.status(404).json({ message: "Pool processing not found" });
        res.status(200).json({ message: "Pool processing updated successfully", poolProcessing });
    } catch (err) {
        logger.error("Error updating pool processing: ", err);
        res.status(500).json({ message: "Error updating pool processing" });
    }
}
// delete pool processing
exports.deletePoolProcessing = async (req, res) => {
    const { id:pPoolId } = req.params;
    try {
        const poolProcessing = await PoolProcessing.findByIdAndDelete(pPoolId);
        if (!poolProcessing) return res.status(404).json({ message: "Pool processing not found" });
        res.status(200).json({ message: "Pool processing deleted successfully" });
    } catch (err) {
        logger.error("Error deleting pool processing: ", err);
        res.status(500).json({ message: "Error deleting pool processing" });
    }
}

// get all pool processing
exports.getPoolProcessings = async (req, res) => {
    try {
        const poolProcessings = await PoolProcessing.find({});
        res.status(200).json({ message: poolProcessings });
    } catch (err) {
        logger.error("Error getting pool processings: ", err);
        res.status(500).json({ message: "Error getting pool processings" });
    }
}

// get pool processing by pool id
exports.getPoolProcessingByPoolId = async (req, res) => {
    const { pool_id } = req.params;
    try {
        const poolProcessing = await PoolProcessing.find({ pool_id });
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
    try {
        const poolProcessing = await PoolProcessing.find({ symbol });
        if (!poolProcessing) return res.status(404).json({ message: "Pool processing not found" });
        res.status(200).json({ message: poolProcessing });
    } catch (err) {
        logger.error("Error getting pool processing: ", err);
        res.status(500).json({ message: "Error getting pool processing" });
    }
}


