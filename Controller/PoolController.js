const Pool = require("../models/Pool");
const { logger } = require("../logger");
const { superAdminWalletAddress } = require("../config");
// create a pool
exports.createPool = async (req, res) => {
    const { symbol, pool_type, leverage } = req.body;
    const start_timestamps = Date.now();
    const process_timestamps = start_timestamps + 1 * 5 * 60 * 1000; // 1 hour later
    const end_timestamps = start_timestamps + 1 * 10 * 60 * 1000; // 24 hours later
    const unit = 'USDT';
    const total_amount = 0;
    const status = "OPEN";
    const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to create a pool" });
    }
    try {
        const pool = new Pool({
            orders: [], symbol, total_amount, unit, pool_type, start_timestamps,
            process_timestamps, end_timestamps, leverage, status, createdBy
        });
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
    const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to create a pool" });
    }
    try {
        const pool = await Pool.findOne({ _id: poolId, createdBy });
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
    const { leverage, total_amount, status, orders } = req.body;
    const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to create a pool" });
    }

    try {
        // Check if the pool exists and belongs to the user
        const pool = await Pool.findById(poolId);
        if (!pool) return res.status(404).json({ message: "Pool not found" });
        if (pool.createdBy !== createdBy) {
            return res.status(403).json({ message: "You do not have permission to update this pool" });
        }
        const updatedPool = await Pool.findByIdAndUpdate(poolId, { orders, leverage, total_amount, status }, { new: true });
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
    const { walletAddress: createdBy } = req.user;
    if (createdBy != superAdminWalletAddress) {
        return res.status(403).json({ message: "You do not have permission to create a pool" });
    }
    try {
        const pool = await Pool.findById(poolId);
        if (!pool) return res.status(404).json({ message: "Pool not found" });
        // Check if the pool exists and belongs to the user
        if (pool.createdBy !== createdBy) {
            return res.status(403).json({ message: "You do not have permission to delete this pool" });
        }

        await Pool.findByIdAndDelete(poolId);

        res.status(200).json({ message: "Pool deleted successfully" });
    } catch (err) {
        logger.error("Error deleting pool: ", err);
        res.status(500).json({ message: "Error deleting pool" });
    }
}

// *** get all pools
exports.getAllPools = async (req, res) => {
    try {
        // const pools = await Pool.find({ status: "OPEN" }, { _id: 0, leverage: 0, total_amount: 0, createdBy: 0 })
        //     .sort({ start_timestamps: -1 });
        const pools = await Pool.aggregate([
            { $match: { status: { $in: ["OPEN", "PROCESSING"] } } },
            { $sort: { start_timestamps: -1 } },
            {
                $project: {
                    ordersCount: { $size: "$orders" },
                    // Optionally include other fields
                    symbol: 1,
                    unit: 1,
                    pool_type: 1,
                    start_timestamps: 1,
                    process_timestamps: 1,
                    end_timestamps: 1,
                    status: 1,
                }
            }
        ]);
        if (!pools || pools.length === 0) return res.status(404).json({ message: "No pools found" });
        // Return only the necessary fields
        res.status(200).json({ pools });
    } catch (err) {
        logger.error("Error getting pools: ", err);
        res.status(500).json({ message: "Error getting pools" });
    }
}
