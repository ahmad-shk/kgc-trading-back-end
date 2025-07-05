const schedule = require('node-schedule');
const PlaceOrder = require("../models/PlaceOrder");
const Pool = require("../models/Pool");
const PoolProcessing = require("../models/PoolProcessing");
const PoolResults = require("../models/PoolResults");
const { logger } = require("../logger");
const { generateKey } = require("../utils/helper");
const { superAdminWalletAddress, botAddressList } = require("../config");
const { fundTransfer } = require('../Controller/TokenController');

const poolProcessing = async () => {
    try {
        const pools = await Pool.find({ status: "OPEN" });
        if (pools.length === 0) {
            // console.log("No open pools found.");
            logger.info("No open pools found.");
            return;
        }
        // console.log(`Found ${pools.length} open pools.`);
        logger.info(`🐳 Found ${pools.length} open pools.`);
        for (const pool of pools) {
            const { _id: poolId, orders, symbol, end_timestamps, process_timestamps } = pool;
            const currentTime = Date.now();

            if (orders.length === 0) {
                // console.log(`Pool ${poolId} has no orders, skipping processing.`);
                logger.info(`Pool ${poolId} has no orders, skipping processing.`)
                await Pool.findByIdAndUpdate(poolId, { status: "CLOSED" });
                logger.info(`Pool ${poolId} has been closed due to no orders.`)
                // console.log(`Pool ${poolId} has been closed due to no orders.`);
                continue;
            }
            // console.log(`Processing pool ${poolId}...`);
            logger.info(`Processing pool ${JSON.stringify(pool)}...${currentTime}`);
            if (currentTime >= process_timestamps && currentTime <= end_timestamps) {
                // console.log(`Processing pool ${poolId}...`);
                logger.info(`Processing pool ${poolId}...`)
                const ranges = [];
                const orderslist = await PlaceOrder.find({ _id: { $in: orders } });
                if (orderslist.length === 1) {
                    // console.log(`Processing pool count ${orderslist.length} for pool ${poolId}...`);
                    logger.info(`Processing pool count ${orderslist.length} for pool ${poolId}...`)
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
                } else
                    if (orderslist.length > 1) {
                        // console.log(`Processing pool count ${orderslist.length} for pool ${poolId}...`);
                        logger.info(`Processing pool count ${orderslist.length} for pool ${poolId}...`)
                        let ordersList = orderslist
                        if (orderslist.length % 2 === 1) {
                            // console.log(`Pool ${poolId} has an odd number of orders, splitting the last order...`);
                            logger.info(`Pool ${poolId} has an odd number of orders, splitting the last order...`)
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
                        // console.log(`Pool ${poolId} has been split into two halves for processing.`);
                        // console.log(`Total ranges firstHalf: ${firstHalf}`);
                        // console.log(`Total ranges secondHalf: ${secondHalf}`);
                        logger.info(`Pool ${poolId} has been split into two halves for processing.`)
                        logger.info(`Total ranges firstHalf: ${JSON.stringify(firstHalf)}`)
                        logger.info(`Total ranges secondHalf: ${JSON.stringify(secondHalf)}`)

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
        // console.log(`Found ${pools.length} processing pools.`);
        logger.info(`Found ${pools.length} Results processing pools.`);
        if (pools.length === 0) {
            // console.log("No processing pools found.");
            logger.info("No processing pools found.");
            return;
        }

        logger.info(`🐳 Found ${pools.length} processing pools.`);

        logger.info(`Processing pools: ${JSON.stringify(pools)}`);
        for (const pool of pools) {
            const { end_timestamps, process_timestamps } = pool;
            const currentTime = Date.now();
            if (currentTime >= end_timestamps) {
                const processingPool = await PoolProcessing.find({ pool_id: pool._id });
                if (processingPool.length === 0) {
                    // console.log(`No processing pool found for pool ${pool._id}. Skipping.`);
                    logger.info(`No processing pool found for pool ${pool._id}. Skipping.`);
                    continue;
                }
                const { _id: pool_porcessing_id, pool_id, ranges } = processingPool[0];
                // console.log(`Processing pool results for pool ${pool_id}...`);
                // console.log(`Processing pool ranges: ${JSON.stringify(processingPool)}`);
                logger.info(`Processing pool results for pool ${pool_id}...`);
                logger.info(`Processing pool ranges: ${JSON.stringify(processingPool)}`);

                if (ranges && ranges.length === 0) {
                    // console.log(`No ranges found for pool ${pool_id}. Skipping processing.`);
                    logger.info(`No ranges found for pool ${pool_id}. Skipping processing.`);
                    await pool.updateOne({ status: "CLOSED" });
                    // console.log(`Pool ${pool_id} has been closed due to no ranges.`);
                    logger.info(`Pool ${pool_id} has been closed due to no ranges.`);
                    continue;
                }
                for (const range of ranges) {
                    if (range.start == 1) {
                        // This is the winning range
                        const winnerOrder = await PlaceOrder.findById(range.orderId);
                        if (!winnerOrder) {
                            // console.log(`Winner order ${winnerRange.orderId} not found for pool ${pool_id}.`);
                            logger.info(`Winner order ${range.orderId} not found for pool ${pool_id}.`);
                            continue;
                        }
                        const leverage = winnerOrder.leverage || 0; // Default to 0 if leverage is not set
                        const expiry_time = Date.now() + 24 * 60 * 60 * 1000; // Example expiry time set to 24 hours later
                        const profit_loss = winnerOrder.amount * leverage / 100; // Example profit/loss calculation
                        // Create a new PoolResults document
                        // console.log(`Winner order found: ${winnerOrder._id} for pool ${pool_id}. ${pool_porcessing_id}`);
                        logger.info(`🏅Winner order found: ${winnerOrder._id} for pool ${pool_id}. ${pool_porcessing_id}`);
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

                        // Update the winner order status to WINNER
                        await PlaceOrder.findByIdAndUpdate(winnerOrder._id, { status: "WINNER" });
                        // console.log(`Pool ${pool_id} processed successfully. Winner is order ${winnerOrder._id}.`);
                        logger.info(`Pool ${pool_id} processed successfully. Winner is order ${winnerOrder._id}.`);
                        try {
                            if (range.end == 1) {
                                poolResult.transactionHash = generateKey();
                                poolResult.isClaimed = false;
                                poolResult.isExpired = true;
                                // console.log(`Funds transferred to winner order ${winnerOrder._id}: `);
                                logger.info(`Funds transferred to winner order ${winnerOrder._id}: `);
                            } else {
                                const receipt = await fundTransfer(winnerOrder.walletAddress, winnerOrder.amount + profit_loss)
                                poolResult.transactionHash = receipt.transactionHash;
                                poolResult.isClaimed = false;
                                poolResult.isExpired = true;
                                // console.log(`Funds transferred to winner order ${winnerOrder._id}: `, receipt);
                                logger.info(`Funds transferred to winner order ${winnerOrder._id}: ${JSON.stringify(receipt)}`)
                            }

                        } catch (err) {
                            // console.error(`Error transferring funds to winner order ${winnerOrder._id}: `, err);
                            logger.error(`Error transferring funds to winner order ${winnerOrder._id}: `, err);
                        }
                        await poolResult.save();

                    } else
                        if (range.start == 0) {
                            // This is a losing range
                            const loserOrder = await PlaceOrder.findById(range.orderId);
                            if (!loserOrder) {
                                // console.log(`Loser order ${range.orderId} not found for pool ${pool_id}.`);
                                logger.info(`Loser order ${range.orderId} not found for pool ${pool_id}.`);
                                continue;
                            }
                            const leverage = loserOrder.leverage || 0; // Default to 0 if leverage is not set
                            const expiry_time = Date.now() + 24 * 60 * 60 * 1000; // Example expiry time set to 24 hours later
                            const profit_loss = -1 * loserOrder.amount * leverage / 100; // Example profit/loss calculation for losers
                            // console.log(`Loser order found: ${loserOrder._id} for pool ${pool_id}. ${pool_porcessing_id}`);
                            logger.info(`😒Loser order found: ${loserOrder._id} for pool ${pool_id}. ${pool_porcessing_id}`);
                            // Create a new PoolResults document for losers
                            const poolResult = new PoolResults({
                                pool_id,
                                pool_porcessing_id,
                                order_id: loserOrder._id,
                                symbol: pool.symbol,
                                user_id: loserOrder.user_id,
                                walletAddress: loserOrder.walletAddress,
                                amount: loserOrder.amount,
                                calimable_amount: loserOrder.amount + profit_loss, // Losers do not get claimable amount
                                profit_loss,
                                isClaimed: true,
                                expiry_time,
                                isExpired: false,
                                status: "LOSER",
                                createdBy: superAdminWalletAddress,
                            });

                            // Update the loser order status to LOSER
                            await PlaceOrder.findByIdAndUpdate(loserOrder._id, { status: "LOSER" });
                            // console.log(`Pool ${pool_id} processed successfully. loserOrder is order ${loserOrder._id}.`);
                            logger.info(`Pool ${pool_id} processed successfully. loserOrder is order ${loserOrder._id}.`);
                            try {
                                const receipt = await fundTransfer(loserOrder.walletAddress, loserOrder.amount + profit_loss)
                                poolResult.transactionHash = receipt.transactionHash;
                                poolResult.isClaimed = false;
                                poolResult.isExpired = true;
                                // console.log(`Funds transferred to loserOrder order ${loserOrder._id}: `, receipt);
                                logger.info(`Funds transferred to loserOrder order ${loserOrder._id}: ${JSON.stringify(receipt)}`);
                            } catch (err) {
                                // console.error(`Error transferring funds to loserOrder order ${loserOrder._id}: `, err);
                                logger.error(`Error transferring funds to loserOrder order ${loserOrder._id}: `, err);
                            }
                            await poolResult.save();

                        } else
                            if (range.start == 0.5) {
                                // This is a losing range
                                const drawOrder = await PlaceOrder.findById(range.orderId);
                                if (!drawOrder) {
                                    // console.log(`Loser order ${range.orderId} not found for pool ${pool_id}.`);
                                    logger.info(`Loser order ${range.orderId} not found for pool ${pool_id}.`);
                                    continue;
                                }
                                const expiry_time = Date.now() + 24 * 60 * 60 * 1000; // Example expiry time set to 24 hours later
                                const profit_loss = 0 // Example profit/loss calculation for losers
                                // console.log(`Draw order found: ${drawOrder._id} for pool ${pool_id}. ${pool_porcessing_id}`);
                                logger.info(`Draw order found: ${drawOrder._id} for pool ${pool_id}. ${pool_porcessing_id}`);

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

                                // Update the loser order status to LOSER
                                await PlaceOrder.findByIdAndUpdate(drawOrder._id, { status: "DRAW" });
                                // console.log(`Pool ${pool_id} processed successfully. drawOrder is order ${drawOrder._id}.`);
                                logger.info(`Pool ${pool_id} processed successfully. drawOrder is order ${drawOrder._id}.`);
                                try {
                                    const receipt = await fundTransfer(drawOrder.walletAddress, drawOrder.amount)

                                    poolResult.transactionHash = receipt.transactionHash;
                                    poolResult.isClaimed = false;
                                    poolResult.isExpired = true;
                                    // console.log(`Funds transferred to drawOrder order ${drawOrder._id}: `, receipt);
                                    logger.info(`Funds transferred to drawOrder order ${drawOrder._id}: ${JSON.stringify(receipt)}`);
                                } catch (err) {
                                    // console.error(`Error transferring funds to drawOrder order ${drawOrder._id}: `, err);
                                    logger.error(`Error transferring funds to drawOrder order ${drawOrder._id}: `, err);
                                }
                                await poolResult.save();
                            }
                }
                // Update the pool status to CLOSED
                // console.log(`Pool ${pool_id} has been processed and closed.`);
                logger.info(`Pool ${pool_id} has been processed and closed.`);
                await Pool.findByIdAndUpdate(pool_id, { status: "CLOSED" });
            }
        }
    } catch (err) {
        logger.error("Error processing pool results: ", err);
    }
};

const job = schedule.scheduleJob(' */5 * * * *', async (fireDate) => {
    // console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
    logger.info(`This job was supposed to run at ${fireDate}, but actually ran at ${new Date()}`);
    // Here you can call your processing function or any other logic you want to execute every 5 minutes
    // poolResultsProcessing()
    //     .then(() => console.log("All processing pools results processed successfully."))
    //     .catch(err => logger.error("Error processing pool results: ", err));

    // poolProcessing()
    //     .then(() => console.log("All open pools processed successfully."))
    //     .catch(err => logger.error("Error processing open pools: ", err));
    logger.info(`🏃 Starting processing-pools results...{${Date.now()}}`);
    await poolResultsProcessing()
    logger.info("✅ All processing-pools results processed successfully.");
    logger.info(`🏃 Starting pool-processing  ...{${Date.now()}}`);
    await poolProcessing();
    logger.info("✅ All  pool-processing processed successfully.");
    // Process open pools
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