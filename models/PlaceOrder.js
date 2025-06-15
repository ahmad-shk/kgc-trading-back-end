const mongoose = require("mongoose");

const PlaceOrderSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true, unique: true  },
    transactionHash: { type: String, required: true },
    user_id: { type: String, required: true },
    symbol: { type: String, required: true },
    amount: { type: Number, required: true },
    unit: { type: String, enum: ["USDT", "ETH", "BNB"], default: "USDT", required: true },
    order_type: { type: String, enum: ["LONG", "SHORT"], default: "LONG", required: true },
    timestamps: { type: Number, required: true },
    leverage: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "PROCESSING", "LOSER", "WINNER", "DRAW"], default: "PENDING", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = mongoose.model("PlaceOrder", PlaceOrderSchema);

