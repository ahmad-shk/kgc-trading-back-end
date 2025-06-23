const express = require("express");
const bodyParser = require("body-parser");

const { USDT, paymentReceiver, FundTransfer, totalEnteries } = require("../Controller/TokenController");

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const authMiddleware = require("../middleware/authMiddelware");
// Middleware
router.use(authMiddleware);
// Middleware to parse JSON data

router.route("/TokenbalanceOf/:walletAddress").get(USDT)
router.route("/FundTransfer/:walletAddress").get(FundTransfer)
router.route("/paymentReceiver/:walletAddress").get(paymentReceiver)
router.route("/totalEnteries").get(totalEnteries)
module.exports = router;