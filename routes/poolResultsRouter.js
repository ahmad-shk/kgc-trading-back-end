const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const { createPoolResult,
    getPoolResults,
    getPoolResultById,
    updatePoolResult,
    deletePoolResult,
    getPoolResultsByPoolId,
    getPoolResultsByPoolProcessingId,
    getPoolResultsByUserId,
    getPoolResultsBySymbol,

} = require("../Controller/PoolResultsController");
const authMiddleware = require("../middleware/authMiddelware");

router.use(authMiddleware);

// create a pool result
router.route("/pool-result")
    .post(createPoolResult)
    .get(getPoolResults);
    
// get pool result by id
router.route("/pool-result/:id")
    .get(getPoolResultById)
    .put(updatePoolResult)
    .delete(deletePoolResult);

// get pool results by user id
router.route("/pool-results-byUser")
    .get(getPoolResultsByUserId);

// get pool results by pool id
router.route("/pool-results-byPoolId/:pool_id")
    .get(getPoolResultsByPoolId);
// get pool results by pool processing id
router.route("/pool-results-bypPoolId/:pPoolId")
    .get(getPoolResultsByPoolProcessingId);

// get pool results by symbol
router.route("/pool-results-bySymbol/:symbol")
    .get(getPoolResultsBySymbol);

module.exports = router;