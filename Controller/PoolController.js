const Pool = require("../models/DrawingLotsPool");
const { logger } = require("../logger");

// create a pool
exports.createPool = async (req, res) => {
    const { symbol, pool_type, leverage } = req.body;
    const start_timestamps = Date.now();
    const end_timestamps = start_timestamps + 1 * 10 * 60 * 1000; // 24 hours later
    const unit = 'USDT';
    const total_amount = 0;
    const status = "OPEN";
    const { _id: createdBy } = req.user;
    try {
        const pool = new Pool({ orders:[], symbol, unit, pool_type, leverage, start_timestamps, end_timestamps, total_amount, status, createdBy });
        await pool.save();
        res.status(201).json({ message: "Pool created successfully" });
    } catch (err) {
        logger.error("Error creating pool: ", err);
        res.status(500).json({ message: "Error creating pool" });
    }
}

// get a pool by id
exports.getPoolById = async (req, res) => {
    const { id: poolId } = req.params;
    const { walletAddress } = req.user;
    try {
        const pool = await Pool.findOne({ _id: poolId, walletAddress });
        if (!pool) return res.status(404).json({ message: "Pool not found" });
        res.status(200).json({ message: pool });
    }
    catch (err) {
        logger.error("Error getting pool: ", err);
        res.status(500).json({ message: "Error getting pool" });
    }
}

// update pool
exports.updatePool = async (req, res) => {
    const { id: poolId } = req.params;
    const { walletAddress } = req.user;
    const { leverage, total_amount, status, orders} = req.body;
    try {
        // Check if the pool exists and belongs to the user
        const pool = await Pool.findById(poolId);
        if (!pool) return res.status(404).json({ message: "Pool not found" });
        if (pool.walletAddress !== walletAddress) {
            return res.status(403).json({ message: "You do not have permission to update this pool" });
        }
        const updatedPool = await Pool.findByIdAndUpdate(poolId, { orders,leverage, total_amount, status }, { new: true });
        if (!updatedPool) return res.status(404).json({ message: "Pool not found" });
        res.status(200).json({ message: "Pool updated successfully", updatedPool });
    } catch (err) {
        logger.error("Error updating pool: ", err);
        res.status(500).json({ message: "Error updating pool" });
    }
}

// delete pool
exports.deletePool = async (req, res) => {
    const { id: poolId } = req.params;
    const { walletAddress } = req.user;
    try {

        const pool = await Pool.findById(poolId);
        if (!pool) return res.status(404).json({ message: "Pool not found" });
        // Check if the pool exists and belongs to the user
        if (pool && pool.walletAddress !== walletAddress) {
            return res.status(403).json({ message: "You do not have permission to delete this pool" });
        }

        const _pool = await Pool.findByIdAndDelete(poolId, { walletAddress });

        res.status(200).json({ message: "Pool deleted successfully" });
    } catch (err) {
        logger.error("Error deleting pool: ", err);
        res.status(500).json({ message: "Error deleting pool" });
    }
}

// get all pools
exports.getAllPools = async (req, res) => {
    try {
        const pools = await Pool.find({status: "OPEN"}).sort({ start_timestamps: -1 });
        if (!pools || pools.length === 0) return res.status(404).json({ message: "No pools found" });
         // Return only the necessary fields
        res.status(200).json({ message: pools });
    } catch (err) {
        logger.error("Error getting pools: ", err);
        res.status(500).json({ message: "Error getting pools" });
    }
}
