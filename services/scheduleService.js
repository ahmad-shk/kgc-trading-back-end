const schedule = require('node-schedule');
const PlaceOrder = require("../models/PlaceOrder");
const Pool = require("../models/Pool");
const PoolProcessing = require("../models/PoolProcessing");
const PoolResults = require("../models/PoolResults");
const { logger } = require("../logger");
const { generateKey } = require("../utils/helper");
const { superAdminWalletAddress, botAddressList } = require("../config");
const { fundTransfer } = require('../Controller/TokenController');

const nRanges = (poolId, orders = []) => {
    const ranges = []
    let ordersList = orders
    if (orders.length % 2 === 1) {
        logger.info(`Pool ${poolId} has an odd number of orders, splitting the last order...`)
        // we need to split the orders into two parts sort by createAt and last order spilt and others array
        const sortbyCreatedAt = orders.sort((a, b) => a.createdAt - b.createdAt);
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
    logger.info(`Pool ${poolId} has been split into two halves for processing.`)
    logger.info(`Total ranges firstHalf: ${JSON.stringify(firstHalf)}`)
    logger.info(`Total ranges secondHalf: ${JSON.stringify(secondHalf)}`)
    return ranges;
}

const botOrderPlace = async (order) => {
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
    return await botOrder.save();
}
const generateResults = async (orderId, pool, pool_porcessing_id, status, is_bot) => {
    logger.info(`🔄 order ID: ${orderId} pool ID:${pool._id} Pool Porcessing ID:${pool_porcessing_id}`);
    const order = await PlaceOrder.findById(orderId);
    if (!order) {
        logger.info(`Order ${orderId} not found for pool ${pool._id}.`);
        return;
    }
    const leverage = order.leverage || 0;
    const expiry_time = Date.now() + 24 * 60 * 60 * 1000;
    const profit_loss = status === 'LOSER' ? -1 * order.amount * leverage / 100 : status === 'WINNER' ? order.amount * leverage / 100 : 0;

    const poolResult = new PoolResults({
        pool_id: pool._id, pool_porcessing_id, order_id: order._id, symbol: pool.symbol,
        user_id: order.user_id, walletAddress: order.walletAddress,
        amount: order.amount, calimable_amount: order.amount + profit_loss, profit_loss,
        isClaimed: true, expiry_time, isExpired: false, status,
        createdBy: superAdminWalletAddress,
    });

    await PlaceOrder.findByIdAndUpdate(order._id, { status });
    logger.info(`Pool ${pool._id} processed successfully. order ID: ${order._id}.`);
    try {
        if (is_bot) {
            poolResult.transactionHash = generateKey();
            poolResult.isClaimed = false;
            poolResult.isExpired = true;
            logger.info(`Funds transferred to order ${order._id}`);
        } else {
            const receipt = await fundTransfer(order.walletAddress, order.amount + profit_loss)
            poolResult.transactionHash = receipt.transactionHash;
            poolResult.isClaimed = false;
            poolResult.isExpired = true;
            logger.info(`💲Funds transferred to order ${order._id}: ${receipt.transactionHash}`);
            // logger.info(`Detail of tansaction :${ JSON.stringify(receipt)}`);
        }
    } catch (err) {
        logger.error(`❌ Error transferring funds to order ${order._id}: `, err);
    }
    await poolResult.save();
}

const poolProcessing = async () => {
    try {
        const pools = await Pool.find({ status: "OPEN" });
        if (pools.length === 0) {
            logger.info("No open pools found.");
            return;
        }
        logger.info(`🐳 Found ${pools.length} open pools.`);
        for (const pool of pools) {
            const { _id: poolId, orders, symbol, end_timestamps, process_timestamps } = pool;
            const currentTime = Date.now();

            if (orders.length === 0) {
                logger.info(`Pool ${poolId} has no orders, skipping processing.`)
                await Pool.findByIdAndUpdate(poolId, { status: "CLOSED" });
                logger.info(`Pool ${poolId} has been closed due to no orders.`)
                continue;
            }
            logger.info(`Processing pool ${JSON.stringify(pool)}...${currentTime}`);
            if (currentTime >= process_timestamps && currentTime <= end_timestamps) {
                logger.info(`Processing pool ${poolId}...`)
                const ranges = [];
                const orderslist = await PlaceOrder.find({ _id: { $in: orders } });
                if (orderslist.length === 1) {
                    logger.info(`Processing pool count ${orderslist.length} for pool ${poolId}...`)
                    const order = orderslist[0];
                    ranges.push({ start: 0, end: 0, leverage: order.leverage * order.amount, orderId: order._id });
                    const botOrder = await botOrderPlace(order)
                    ranges.push({ start: 1, end: 1, leverage: botOrder.leverage * botOrder.amount, orderId: botOrder._id });
                    // Update the pool with the new order
                    pool.orders.push(botOrder._id);
                    pool.total_amount += order.amount;
                    await pool.save();

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
                } else if (orderslist.length > 1) {
                    logger.info(`Processing pool count ${orderslist.length} for pool ${poolId}...`)
                    const n_ranges = nRanges(poolId, orderslist)
                    const processingPool = new PoolProcessing({
                        pool_id: poolId,
                        symbol,
                        random_number: 1,
                        random_start_range: 0,
                        random_end_range: 2,
                        ranges: n_ranges,
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
        logger.info(`Found ${pools.length} Results processing pools.`);
        if (pools.length === 0) {
            logger.info("No processing pools found.");
            return;
        }

        logger.info(`🐳 Found ${pools.length} processing pools.`);
        logger.info(`Processing pools: ${JSON.stringify(pools)}`);

        for (const pool of pools) {
            const currentTime = Date.now();
            if (currentTime >= pool.end_timestamps) {
                const processingPool = await PoolProcessing.find({ pool_id: pool._id });
                if (processingPool.length === 0) {
                    logger.info(`No processing pool found for pool ${pool._id}. Skipping.`);
                    continue;
                }
                const { _id: pool_porcessing_id, pool_id, ranges } = processingPool[0];
                logger.info(`Processing pool results for pool ${pool_id}...`);
                logger.info(`Processing pool ranges: ${JSON.stringify(processingPool)}`);

                if (ranges && ranges.length === 0) {
                    logger.info(`No ranges found for pool ${pool_id}. Skipping processing.`);
                    await pool.updateOne({ status: "CLOSED" });
                    logger.info(`Pool ${pool_id} has been closed due to no ranges.`);
                    continue;
                }
                for (const range of ranges) {
                    if (range.start == 1) {
                        // This is the winning range
                        logger.info(`🏅Winner order found: ${range.orderId} for pool:${pool_id} pool_porcessing_id:${pool_porcessing_id}`);
                        await generateResults(range.orderId, pool, pool_porcessing_id, "WINNER", range.end == 1 ? true : false);
                    } else if (range.start == 0) {
                        // This is a losing range
                        logger.info(`😒Loser order found: ${range.orderId} for pool:${pool_id} pool_porcessing_id:${pool_porcessing_id}`);
                        await generateResults(range.orderId, pool, pool_porcessing_id, "LOSER");
                    } else if (range.start == 0.5) {
                        // This is a draw range
                        logger.info(`Draw order found: ${range.orderId} for pool:${pool_id} pool_porcessing_id:${pool_porcessing_id}`);
                        await generateResults(range.orderId, pool, pool_porcessing_id, "DRAW");
                    }
                }
                // Update the pool status to CLOSED
                logger.info(`Pool ${pool_id} has been processed and closed.`);
                await Pool.findByIdAndUpdate(pool_id, { status: "CLOSED" });
            }
        }
    } catch (err) {
        logger.error("Error processing pool results: ", err);
    }
};

const job = schedule.scheduleJob(' */5 * * * *', async (fireDate) => {
    logger.info(`This job was supposed to run at ${fireDate}, but actually ran at ${new Date()}`);
    logger.info("▶️🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰");
    logger.info(`RESULTS:🏃 Starting processing-pools for results ...{${Date.now()}}`);
    await poolResultsProcessing()
    logger.info("⏩🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰");
    logger.info(`🏃 Starting pool-processing  ...{${Date.now()}}`);
    await poolProcessing();
    logger.info("🆗🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰");
    logger.info("✅ Job completed successfully.");
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