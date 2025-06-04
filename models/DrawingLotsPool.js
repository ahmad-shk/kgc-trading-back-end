const mongoose = require("mongoose");

const PoolSchema = new mongoose.Schema({
    orders: { type: [String], required: true },
    symbol: { type: String, required: true },
    total_amount: { type: Number, required: true },
    unit: { type: String,  enum: ["USDT", "ETH", "BNB"], default: "USDT", required: true },
    pool_type: { type: String, enum: ["LONG", "SHORT"], default: "LONG",  required: true },
    start_timestamps: { type: Number, required: true },
    end_timestamps: { type: Number, required: true },
    leverage: { type: Number, required: true },
    status: { type: String, enum: ["OPEN", "CLOSE", "PROCESSING"], default: "OPEN", required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = mongoose.model("Pool", PoolSchema);

