const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const { createPool, getAllPools, getPoolById, updatePool, deletePool, } = require("../Controller/PoolController");
const authMiddleware = require("../middleware/authMiddelware");

router.use(authMiddleware);
// create a pool
router.route("/pool")
    .post(createPool)
    .get(getAllPools);

// get pool by id
router.route("/pool/:id")
    .get(getPoolById)
    .put(updatePool)
    .delete(deletePool);


module.exports = router;

