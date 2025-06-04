
const PlaceOrder = require("../models/PlaceOrder");

const { logger } = require("../logger");

// create a order
exports.createOrder = async (req, res) => {
    const { symbol, amount, unit, order_type, leverage } = req.body;
    const { walletAddress, _id: user_id } = req.user;
    const timestamps = Date.now();
    const status = "pending";
    const payload = { walletAddress, user_id, symbol, amount, unit, order_type, timestamps, leverage, status }
    // console.log("Payload: ", payload);
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
    // console.log("Wallet Address: ", walletAddress);
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