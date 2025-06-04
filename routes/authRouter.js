const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
const authMiddleware = require("../middleware/authMiddelware");
const { createAccount, getAccount, login, getAllUser } = require("../Controller/AuthController");

// Login
router.route("/login").post(login);
router.route("/login2").post(login);

// Get Account info
router.route("/account/:walletAddress").get(authMiddleware, getAccount);

// Create Account
router.route("/account").post(createAccount);

// get all user
router.route("/get_all_users").get(authMiddleware, getAllUser);

module.exports = router;