const schedule = require('node-schedule');
const PlaceOrder = require("../models/PlaceOrder");
const Pool = require("../models/Pool");
const PoolProcessing = require("../models/PoolProcessing");
const PoolResults = require("../models/PoolResults");
const { logger } = require("../logger");
const {generateKey} = require("../utils/helper");
const { superAdminWalletAddress, botAddressList } = require("../config");

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
                const ranges = [];
                const orderslist = await PlaceOrder.find({ _id: { $in: orders } });
                if (orderslist.length === 1) {
                    console.log(`Processing pool count ${orderslist.length} for pool ${poolId}...`);
                    const order = orderslist[0];
                    ranges.push({ start: 0, end: 0, leverage: order.leverage * order.amount, orderId: order._id });
                    const randomNum = Math.floor(Math.random() * 4)
                    const selectedBot = botAddressList[randomNum];
                    // place order for bot
                    const botOrder = new PlaceOrder({
                        transactionHash: generateKey(),
                        user_id: selectedBot,
                        walletAddress: selectedBot,
                        amount: order.amount,
                        unit: order.unit,
                        order_type: order.order_type,
                        leverage: order.leverage,
                        symbol: order.symbol,
                        status: "PROCESSING",
                        timestamps: Date.now(),
                        createdBy: superAdminWalletAddress,
                    });
                    await botOrder.save();
                    ranges.push({ start: 1, end: 1, leverage: botOrder.leverage * botOrder.amount, orderId: botOrder._id });

                    const processingPool = new PoolProcessing({
                        pool_id: poolId,
                        symbol,
                        random_number: 0,
                        random_start_range: 0,
                        random_end_range: 1,
                        ranges,
                        total_users: ranges.length,
                        createdBy: superAdminWalletAddress,
                    });
                    await processingPool.save();
                    await Pool.findByIdAndUpdate(poolId, { ordersCount: 2 });
                } else if (orderslist.length > 1) {
                    console.log(`Processing pool count ${orderslist.length} for pool ${poolId}...`);
                    let ordersList = orderslist
                    if (orderslist.length % 2 === 1) {
                        console.log(`Pool ${poolId} has an odd number of orders, splitting the last order...`);
                        // we need to split the orders into two parts sort by createAt and last order spilt and others array
                        const sortbyCreatedAt = orderslist.sort((a, b) => a.createdAt - b.createdAt);
                        const lastOrder = sortbyCreatedAt.pop(); // remove the last order
                        // Sort the others by leverage and amount
                        ranges.push({
                            start: 0.5,
                            end: 0.5,
                            leverage: lastOrder.leverage * lastOrder.amount,
                            orderId: lastOrder._id
                        })
                        ordersList = sortbyCreatedAt;
                    }
                    // Sort orders by leverage and amount
                    const sortedOrders = ordersList.sort((a, b) => {
                        const aValue = a.leverage * a.amount;
                        const bValue = b.leverage * b.amount;
                        return aValue - bValue; // ascending; use bValue - aValue for descending
                    });
                    // Split the sorted orders into two halves
                    const midIndex = Math.floor(sortedOrders.length / 2);
                    const firstHalf = sortedOrders.slice(0, midIndex);
                    const secondHalf = sortedOrders.slice(midIndex);
                    // Create ranges for the first half
                    firstHalf.forEach((order) => {
                        ranges.push({
                            start: 1,
                            end: 0,
                            leverage: order.leverage * order.amount,
                            orderId: order._id
                        });
                    })
                    // Create ranges for the second half
                    secondHalf.forEach((order) => {
                        ranges.push({
                            start: 0,
                            end: 1,
                            leverage: order.leverage * order.amount,
                            orderId: order._id
                        });
                    });
                    console.log(`Pool ${poolId} has been split into two halves for processing.`);
                    console.log(`Total ranges firstHalf: ${firstHalf}`);
                    console.log(`Total ranges secondHalf: ${secondHalf}`);

                    const processingPool = new PoolProcessing({
                        pool_id: poolId,
                        symbol,
                        random_number: 1,
                        random_start_range: 0,
                        random_end_range: 2,
                        ranges,
                        total_users: ranges.length,
                        createdBy: superAdminWalletAddress,
                    });
                    await processingPool.save();
                }
                // Update the pool status to PROCESSING
                await Pool.findByIdAndUpdate(poolId, { status: "PROCESSING" });
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
        const pools = await Pool.find({ status: "PROCESSING" });
        // const pools = await Pool.find({ status: "PROCESSING" }).populate("orders");
        console.log(`Found ${pools.length} processing pools.`);
        if (pools.length === 0) {
            console.log("No processing pools found.");
            return;
        }

        for (const pool of pools) {
            const processingPool = await PoolProcessing.find({ pool_id: pool._id });
            if (processingPool.length === 0) {
                console.log(`No processing pool found for pool ${pool._id}. Skipping.`);
                continue;
            }
            const {_id:pool_porcessing_id, pool_id, ranges } = processingPool[0];
            console.log(`Processing pool results for pool ${pool_id}...`);
            console.log(`Processing pool ranges: ${JSON.stringify(processingPool)}`);
            // const pool = await Pool.findById(pool_id);
            // if (!pool) {
            //     console.log(`Pool ${pool_id} not found.`);
            //     continue;
            // }
            if (ranges && ranges.length === 0) {
                console.log(`No ranges found for pool ${pool_id}. Skipping processing.`);
                await pool.updateOne({ status: "CLOSED" });
                // await PoolProcessing.findByIdAndUpdate(processingPool._id, { status: "CLOSED" });
                console.log(`Pool ${pool_id} has been closed due to no ranges.`);
                continue;
            }
            for (const range of ranges) {
                if (range.start == 1) {
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
                    console.log(`Winner order found: ${winnerOrder._id} for pool ${pool_id}. ${pool_porcessing_id}`);
                    const poolResult = new PoolResults({
                        pool_id,
                        pool_porcessing_id,
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
                } else
                    if (range.start == 0) {
                        // This is a losing range
                        const loserOrder = await PlaceOrder.findById(range.orderId);
                        if (!loserOrder) {
                            console.log(`Loser order ${range.orderId} not found for pool ${pool_id}.`);
                            continue;
                        }
                        const leverage = loserOrder.leverage || 0; // Default to 0 if leverage is not set
                        const expiry_time = Date.now() + 24 * 60 * 60 * 1000; // Example expiry time set to 24 hours later
                        const profit_loss = loserOrder.amount * leverage / 100; // Example profit/loss calculation for losers
                        console.log(`Loser order found: ${loserOrder._id} for pool ${pool_id}. ${pool_porcessing_id}`);
                        // Create a new PoolResults document for losers
                        const poolResult = new PoolResults({
                            pool_id,
                            pool_porcessing_id,
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
                    } else
                        if (range.start == 0.5) {
                            // This is a losing range
                            const drawOrder = await PlaceOrder.findById(range.orderId);
                            if (!drawOrder) {
                                console.log(`Loser order ${range.orderId} not found for pool ${pool_id}.`);
                                continue;
                            }
                            const expiry_time = Date.now() + 24 * 60 * 60 * 1000; // Example expiry time set to 24 hours later
                            const profit_loss = 0 // Example profit/loss calculation for losers
                            console.log(`Draw order found: ${drawOrder._id} for pool ${pool_id}. ${pool_porcessing_id}`);
                            // Create a new PoolResults document for losers
                            const poolResult = new PoolResults({
                                pool_id,
                                pool_porcessing_id,
                                order_id: drawOrder._id,
                                symbol: pool.symbol,
                                user_id: drawOrder.user_id,
                                walletAddress: drawOrder.walletAddress,
                                amount: drawOrder.amount,
                                calimable_amount: drawOrder.amount, // Losers do not get claimable amount
                                profit_loss,
                                isClaimed: true,
                                expiry_time,
                                isExpired: false,
                                status: "DRAW",
                                createdBy: superAdminWalletAddress,
                            });
                            await poolResult.save();
                            // Update the loser order status to LOSER
                            await PlaceOrder.findByIdAndUpdate(drawOrder._id, { status: "DRAW" });
                        }
            }
            // Update the range status to CLOSED
            // await PoolProcessing.findByIdAndUpdate(processingPool._id, { status: "CLOSED" });
            // Update the pool status to CLOSED
            await Pool.findByIdAndUpdate(pool_id, { status: "CLOSED" });
        }
    } catch (err) {
        logger.error("Error processing pool results: ", err);
    }
};

const job = schedule.scheduleJob(' */5 * * * *', async (fireDate) => {
    console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
    // Here you can call your processing function or any other logic you want to execute every 5 minutes
    // poolResultsProcessing()
    //     .then(() => console.log("All processing pools results processed successfully."))
    //     .catch(err => logger.error("Error processing pool results: ", err));

    // poolProcessing()
    //     .then(() => console.log("All open pools processed successfully."))
    //     .catch(err => logger.error("Error processing open pools: ", err));

    await poolResultsProcessing()
    await poolProcessing()
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