const mongoose = require("mongoose");

const PoolProcessingSchema = new mongoose.Schema({
    pool_id: { type: String, required: true },
    symbol: { type: String, required: true },
    random_number: { type: Number, required: true },
    random_start_range: { type: Number, required: true },
    random_end_range: { type: Number, required: true },
    ranges: {
        type: [{
            start: { type: Number, required: true },
            end: { type: Number, required: true },
            leverage: { type: Number, required: true },
            orderId: { type: String, required: true }
            // orderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Order' }
        }],
        required: true
    },
    total_users: { type: Number, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = mongoose.model("PoolProcessing", PoolProcessingSchema);