require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const serverless = require("serverless-http");

const authRouter = require("../routes/authRouter");
const orderRouter = require("../routes/orderRouter");
const poolRouter = require("../routes/poolRouter");
const poolProcessingRouter = require("../routes/poolProcessingRouter");
const poolResultsRouter = require("../routes/poolResultsRouter");
const connectToDatabase = require("../configs/db");
const { job } = require("../services/scheduleService");

const app = express();

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));

// Middleware
app.use(bodyParser.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "healthy",
    message: "Server is running...",
  });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api", orderRouter);
app.use("/api", poolRouter);
app.use("/api", poolProcessingRouter);
app.use("/api", poolResultsRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Connect to DB (only once per cold start)
const setup = async () => {
  try {
    await connectToDatabase();
    console.log("Database connected successfully");
    job(); // optional: background job
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

setup();

// Export as serverless function
module.exports = serverless(app);
