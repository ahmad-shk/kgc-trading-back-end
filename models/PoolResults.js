const mongoose = require("mongoose");

const PoolResultsSchema = new mongoose.Schema({
    pool_id: { type: String, required: true },
    pool_porcessing_id: { type: String, required: true },
    symbol: { type: String, required: true },
    user_id: { type: String, required: true },
    walletAddress: { type: String, required: true },
    amount: { type: Number, required: true },
    calimable_amount: { type: Number, required: true },
    profit_loss: { type: Number, required: true },
    isClaimed: { type: Boolean, default: false },
    expiry_time: { type: Number, required: true },
    isExpired: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = mongoose.model("PoolResults", PoolResultsSchema);