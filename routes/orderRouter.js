const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const { placeOrder, createOrder, getOrders, getOrderById, updateOrder, deleteOrder } = require("../Controller/PlaceOrderController");
const authMiddleware = require("../middleware/authMiddelware");

router.use(authMiddleware);
router.route("/place_order")
    .post(placeOrder)

router.route("/order")
    .post(createOrder)
    .get(getOrders);

router.route("/order/:id")
    .get(getOrderById)
    .put(updateOrder)
    .delete(deleteOrder);

module.exports = router;