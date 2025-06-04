const mongoose = require("mongoose");

const PoolProcessingSchema = new mongoose.Schema({
    pool_id: { type: String, required: true },
    symbol: { type: String, required: true },
    random_number: { type: Number, required: true },
    random_start_range: { type: Number, required: true },
    random_end_range: { type: Number, required: true },
    ranges: {
        type: [[Number]],
        required: true,
        validate: {
            validator: function (arr) {
                return arr.every(
                    pair => Array.isArray(pair) && pair.length === 2 && pair.every(num => typeof num === 'number')
                );
            },
            message: props => `${props.value} is not a valid array of [start, end] pairs.`
        }
    },
    total_users: { type: Number, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = mongoose.model("PoolProcessing", PoolProcessingSchema);