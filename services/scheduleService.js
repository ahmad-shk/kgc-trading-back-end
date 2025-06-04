const schedule = require('node-schedule');
const PlaceOrder = require("../models/PlaceOrder");
const Pool = require("../models/Pool");
const PoolProcessing = require("../models/PoolProcessing");
const PoolResults = require("../models/PoolResults");
const { logger } = require("../logger");
const { superAdminWalletAddress } = require("../config");

const LEVERAGE = [0, 5, 10, 15, 20, 25, 30, 35, 40];

const poolProcessing = async () => {
    try {
        const pools = await Pool.find({ status: "OPEN" });
        if (pools.length === 0) {
            console.log("No open pools found.");
            return;
        }
        for (const pool of pools) {
            const { _id: poolId, orders, symbol, end_timestamps, process_timestamps } = pool;
            const currentTime = Date.now();
            if (orders.length === 0) {
                console.log(`Pool ${poolId} has no orders, skipping processing.`);
                await Pool.findByIdAndUpdate(poolId, { status: "CLOSED" });
                console.log(`Pool ${poolId} has been closed due to no orders.`);
                continue;
            }
            if (currentTime >= process_timestamps && currentTime <= end_timestamps) {
                // Process the pool
                console.log(`Processing pool ${poolId}...`);
                let start_range = 10;
                let end_range = 10;
                const ranges = [];
                const orderslist = await PlaceOrder.find({ _id: { $in: orders } });
                orderslist.sort((a, b) => {
                    if (a.leverage === b.leverage) {
                        return a.amount - b.amount; // Sort by amount if leverage is the same
                    }
                    return a.leverage - b.leverage; // Sort by leverage
                });
                orderslist.forEach(order => {
                    if (order.leverage && LEVERAGE.includes(order.leverage)) {
                        if (LEVERAGE[8] > order.leverage) {
                            end_range = 40 + start_range - order.leverage;
                            const rangeObj = { start: start_range, end: end_range, leverage: order.leverage, orderId: order._id };
                            ranges.push(rangeObj);
                            start_range = end_range;
                        } else {
                            const rangeObj = { start: 0, end: 0, leverage: 0, orderId: order._id };
                            ranges.push(rangeObj);
                        }
                    } else {
                        const rangeObj = { start: 0, end: 0, leverage: 0, orderId: order._id };
                        ranges.push(rangeObj);
                    }
                });
                start_range = 10; // Reset start range for random number generation
                // Generate a random number within the range
                const random_number = Math.floor(Math.random() * (end_range - start_range + 1)) + start_range;
                const processingPool = new PoolProcessing({
                    pool_id: poolId,
                    symbol,
                    random_number,
                    random_start_range: start_range,
                    random_end_range: end_range,
                    ranges,
                    total_users: orders.length,
                    createdBy: superAdminWalletAddress,
                });
                await processingPool.save();
                // Update the pool status to PROCESSING
                await Pool.findByIdAndUpdate(poolId, { status: "PROCESSING" });
                console.log(`Pool ${poolId} is now being processed with random number ${random_number}.`);
                // update the orders status to PROCESSING
                await PlaceOrder.updateMany(
                    { _id: { $in: orders } },
                    { $set: { status: "PROCESSING" } }
                );
            }
        }
    } catch (err) {
        logger.error("Error fetching or processing pools: ", err);
    }
};

const poolResultsProcessing = async () => {
    try {
        const processingPools = await PoolProcessing.find({ status: "PROCESSING" });
        if (processingPools.length === 0) {
            console.log("No processing pools found.");
            return;
        }
        for (const processingPool of processingPools) {
            const { pool_id, random_number, ranges } = processingPool;
            const pool = await Pool.findById(pool_id);
            if (!pool) {
                console.log(`Pool ${pool_id} not found.`);
                continue;
            }
            if (ranges.length === 0) {
                console.log(`No ranges found for pool ${pool_id}. Skipping processing.`);
                await processingPool.updateOne({ status: "CLOSED" });
                await PoolProcessing.findByIdAndUpdate(processingPool._id, { status: "CLOSED" });
                console.log(`Pool ${pool_id} has been closed due to no ranges.`);
                continue;
            }
            for (const range of ranges) {
                if (range.start <= random_number && range.end >= random_number) {
                    // This is the winning range
                    const winnerOrder = await PlaceOrder.findById(range.orderId);
                    if (!winnerOrder) {
                        console.log(`Winner order ${winnerRange.orderId} not found for pool ${pool_id}.`);
                        continue;
                    }
                    const leverage = winnerOrder.leverage || 0; // Default to 0 if leverage is not set
                    const expiry_time = Date.now() + 24 * 60 * 60 * 1000; // Example expiry time set to 24 hours later
                    const profit_loss = winnerOrder.amount * leverage / 100; // Example profit/loss calculation
                    // Create a new PoolResults document
                    const poolResult = new PoolResults({
                        pool_id,
                        pool_porcessing_id: processingPool._id,
                        order_id: winnerOrder._id,
                        symbol: pool.symbol,
                        user_id: winnerOrder.user_id,
                        walletAddress: winnerOrder.walletAddress,
                        amount: winnerOrder.amount,
                        calimable_amount: winnerOrder.amount + profit_loss,
                        profit_loss,
                        isClaimed: true,
                        expiry_time,
                        isExpired: false,
                        status: "WINNER",
                        createdBy: superAdminWalletAddress,
                    });
                    await poolResult.save();
                    // Update the winner order status to WINNER
                    await PlaceOrder.findByIdAndUpdate(winnerOrder._id, { status: "WINNER" });
                    console.log(`Pool ${pool_id} processed successfully. Winner is order ${winnerOrder._id}.`);
                } else {
                    // This is a losing range
                    const loserOrder = await PlaceOrder.findById(range.orderId);
                    if (!loserOrder) {
                        console.log(`Loser order ${range.orderId} not found for pool ${pool_id}.`);
                        continue;
                    }
                    const leverage = loserOrder.leverage || 0; // Default to 0 if leverage is not set
                    const expiry_time = Date.now() + 24 * 60 * 60 * 1000; // Example expiry time set to 24 hours later
                    const profit_loss = loserOrder.amount * leverage / 100; // Example profit/loss calculation for losers
                    // Create a new PoolResults document for losers
                    const poolResult = new PoolResults({
                        pool_id,
                        pool_porcessing_id: processingPool._id,
                        order_id: loserOrder._id,
                        symbol: pool.symbol,
                        user_id: loserOrder.user_id,
                        walletAddress: loserOrder.walletAddress,
                        amount: loserOrder.amount,
                        calimable_amount: loserOrder.amount - profit_loss, // Losers do not get claimable amount
                        profit_loss,
                        isClaimed: true,
                        expiry_time,
                        isExpired: false,
                        status: "LOSER",
                        createdBy: superAdminWalletAddress,
                    });
                    await poolResult.save();
                    // Update the loser order status to LOSER
                    await PlaceOrder.findByIdAndUpdate(loserOrder._id, { status: "LOSER" });
                }
            }
            // Update the range status to CLOSED
            await PoolProcessing.findByIdAndUpdate(processingPool._id, { status: "CLOSED" });
            // Update the pool status to CLOSED
            await Pool.findByIdAndUpdate(pool_id, { status: "CLOSED" });
        }
    } catch (err) {
        logger.error("Error processing pool results: ", err);
    }
};

const job = schedule.scheduleJob(' */5 * * * *', (fireDate) => {
    console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
    // Here you can call your processing function or any other logic you want to execute every 5 minutes
    poolResultsProcessing()
        .then(() => console.log("All processing pools results processed successfully."))
        .catch(err => logger.error("Error processing pool results: ", err));

    poolProcessing()
        .then(() => console.log("All open pools processed successfully."))
        .catch(err => logger.error("Error processing open pools: ", err));

});

process.on('SIGINT', () => {
    schedule.gracefulShutdown()
        .then(() => process.exit(0))
        .catch(err => {
            logger.error("Error during graceful shutdown: ", err);
            process.exit(1);
        });
});

module.exports = job;