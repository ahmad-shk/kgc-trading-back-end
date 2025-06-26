
const PlaceOrder = require("../models/PlaceOrder");
const Pool = require("../models/Pool");
const { logger } = require("../logger");
const { superAdminWalletAddress } = require("../config");
const { getTransactionDetails } = require("./TokenController");
// create a order
exports.placeOrder = async (req, res) => {
    const { symbol, amount, unit, order_type, leverage, transactionHash } = req.body;
    const { walletAddress, _id: user_id } = req.user;
    // Validate required transactionHash verification with web3.js or ethers.js
    if (!transactionHash) {
        return res.status(400).json({ message: "Transaction hash is required" });
    } else {
        try {
            const transactionDetails = await getTransactionDetails(transactionHash);
            // console.log("Transaction Details: ", transactionDetails);
            logger.info("Transaction Details: ", transactionDetails);

            if (!transactionDetails || transactionDetails.from.toLowerCase() !== walletAddress.toLowerCase()) {
                return res.status(400).json({ message: "Invalid transaction hash or wallet address mismatch" });
            }

            // const expectedValue = numeral(amount).format('0.0000');
            // if (transactionDetails.value !== expectedValue || transactionDetails.unit !== unit) {
            //     return res.status(400).json({ message: "Transaction amount or unit mismatch" });
            // }

            // // proceed with further processing
        } catch (err) {
            // console.error("Error verifying transaction:", err.message);
            logger.error("Error verifying transaction: ", err.message);
            return res.status(500).json({ message: "Server error during transaction verification" });
        }
    }

    const timestamps = Date.now();
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getMinutes() % 5, 0, 0); // Round down to nearest 5 min and zero seconds/milliseconds
    const start_timestamps = now.getTime();
    const process_timestamps = start_timestamps + 1 * 5 * 60 * 1000; // 5 minutes later
    const end_timestamps = start_timestamps + 1 * 10 * 60 * 1000; // 5 minutes later
    const status = "PENDING";
    const payload = { walletAddress, user_id, symbol, transactionHash, amount, unit, order_type, timestamps, leverage, status }
    // console.log("Payload: ", payload);
    logger.info("Payload: ", payload);

    try {
        const order = new PlaceOrder(payload);
        await order.save();
        // find the pool by symbol and update it
        const pool = await Pool.findOne({ symbol, pool_type: order_type, status: "OPEN" });
        if (pool) {
            // Update the pool with the new order
            pool.orders.push(order._id);
            pool.total_amount += amount;
            await pool.save();
        } else {
            // If no open pool found, create a new one
            const newPool = new Pool({
                orders: [order._id],
                symbol,
                total_amount: amount,
                unit,
                pool_type: order_type,
                start_timestamps,
                process_timestamps,
                end_timestamps,
                leverage,
                status: "OPEN",
                createdBy: superAdminWalletAddress
            });
            // Save the new pool
            await newPool.save();
        }
        res.status(201).json({ message: "Order created successfully" });
    } catch (err) {
        logger.error("Error creating order: ", err);
        res.status(500).json({ message: "Error creating order" });
    }
}

// create a order
exports.createOrder = async (req, res) => {
    const { symbol, amount, unit, order_type, leverage, transactionHash } = req.body;
    const { walletAddress, _id: user_id } = req.user;
    const timestamps = Date.now();
    const status = "PENDING";
    const payload = { walletAddress, user_id, symbol, transactionHash, amount, unit, order_type, timestamps, leverage, status }
    // console.log("Payload: ", payload);
    logger.info("Payload: ", payload);
    try {
        const order = new PlaceOrder(payload);
        await order.save();
        res.status(201).json({ message: "Order created successfully" });
    } catch (err) {
        logger.error("Error creating order: ", err);
        res.status(500).json({ message: "Error creating order" });
    }
}

// get all orders
exports.getOrders = async (req, res) => {
    const { walletAddress } = req.user;
    try {
        const orders = await PlaceOrder.find({ walletAddress });
        res.status(200).json({ message: orders });
    } catch (err) {
        logger.error("Error getting orders: ", err);
        res.status(500).json({ message: "Error getting orders" });
    }
}

// get order by id
exports.getOrderById = async (req, res) => {
    const { id: orderId } = req.params;
    const { walletAddress } = req.user;

    try {
        const order = await PlaceOrder.findOne({
            _id: orderId,
            walletAddress: walletAddress
        });
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.status(200).json({ message: order });
    }
    catch (err) {
        logger.error("Error getting order: ", err);
        res.status(500).json({ message: "Error getting order" });
    }
}
// update order
exports.updateOrder = async (req, res) => {
    const { id: orderId } = req.params;
    const { symbol, amount, unit, order_type, timestamps, leverage, status } = req.body;
    const { walletAddress, _id: userId } = req.user;

    try {
        const order = await PlaceOrder.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Check ownership
        if (order.walletAddress !== walletAddress) {
            return res.status(403).json({ message: "You are not authorized to update this order" });
        }

        const updatedOrder = await PlaceOrder.findByIdAndUpdate(
            orderId,
            {
                walletAddress, user_id: userId, symbol, amount,
                unit, order_type, timestamps, leverage, status
            },
            { new: true }
        );

        return res.status(200).json({
            message: "Order updated successfully",
            order: updatedOrder
        });

    } catch (error) {
        logger.error("Error updating order:", error);
        return res.status(500).json({ message: "An error occurred while updating the order" });
    }

}

// delete order
exports.deleteOrder = async (req, res) => {
    const { id: orderId } = req.params;
    const { walletAddress } = req.user;
    try {
        const findOrder = await PlaceOrder.findById(orderId);

        if (!findOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Check ownership
        if (findOrder.walletAddress !== walletAddress) {
            return res.status(403).json({ message: "You are not authorized to update this order" });
        }
        const order = await PlaceOrder.findByIdAndDelete(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.status(200).json({ message: "Order deleted successfully" });
    } catch (err) {
        logger.error("Error deleting order: ", err);
        res.status(500).json({ message: "Error deleting order" });
    }
}