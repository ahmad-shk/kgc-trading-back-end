const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const { createOrder, getOrders, getOrderById, updateOrder, deleteOrder } = require("../Controller/PlaceOrderController");
const authMiddleware = require("../middleware/authMiddelware");

router.use(authMiddleware);

router.route("/order")
    .post(createOrder)
    .get(getOrders);

router.route("/order/:id")
    .get(getOrderById)
    .put(updateOrder)
    .delete(deleteOrder);

module.exports = router;