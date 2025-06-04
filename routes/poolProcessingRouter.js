const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());


const { createPoolProcessing, getPoolProcessings, getPoolProcessingById, updatePoolProcessing,
     deletePoolProcessing, getPoolProcessingsBySymbol, getPoolProcessingByPoolId } = require("../Controller/PoolProcessingController");
const authMiddleware = require("../middleware/authMiddelware");

router.use(authMiddleware);

// create a pool processing
router.route("/pool-processing")
     .post(createPoolProcessing)
     .get(getPoolProcessings);
// get pool processing by id
router.route("/pool-processing/:id")
     .get(getPoolProcessingById)
     .put(updatePoolProcessing)
     .delete(deletePoolProcessing);
// get all pool processings
router.route("/pool-processings-all").get(getPoolProcessings);
// get pool processing by pool id
router.route("/pool-processing-byPoolId/:pool_id").get(getPoolProcessingByPoolId);
// get pool processings by symbol
router.route("/pool-processings-bySymbol/:symbol").get(getPoolProcessingsBySymbol);

module.exports = router;