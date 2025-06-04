const express = require("express");
const bodyParser = require("body-parser");

const { TokenbalanceOf, GetName, GetTotalSupply,
        GetDecimals, GetSymbol, GetAllowance
    } = require("../Controller/TokenController");

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const authMiddleware = require("../middleware/authMiddelware");
// Middleware
router.use(authMiddleware);
// Middleware to parse JSON data


router.route("/TokenbalanceOf/:walletAddress").get(TokenbalanceOf)
router.route("/GetName").get(GetName)
router.route("/GetTotalSupply").get(GetTotalSupply)
router.route("/GetDecimals").get(GetDecimals)
router.route("/GetSymbol").get(GetSymbol)
router.route("/GetAllowance/:owner/:spender").get(GetAllowance)

module.exports = router;