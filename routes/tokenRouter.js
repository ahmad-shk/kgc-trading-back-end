const express = require("express");
const bodyParser = require("body-parser");

const { FundTransfer } = require("../Controller/TokenController");

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const authMiddleware = require("../middleware/authMiddelware");
// Middleware
router.use(authMiddleware);
// Middleware to parse JSON data

router.route("/FundTransfer/:walletAddress").get(FundTransfer)
module.exports = router;