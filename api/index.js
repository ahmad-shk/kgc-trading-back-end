require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const serverless = require("serverless-http");

// Import routes and configs - adjust paths assuming index.js is at project root
const authRouter = require("./routes/authRouter");
const orderRouter = require("./routes/orderRouter");
const poolRouter = require("./routes/poolRouter");
const poolProcessingRouter = require("./routes/poolProcessingRouter");
const poolResultsRouter = require("./routes/poolResultsRouter");
const connectToDatabase = require("./configs/db");
const { job } = require("./services/scheduleService");

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

// Connect to DB (with simple caching to avoid multiple connects on serverless cold starts)
let isDbConnected = false;

const setup = async () => {
  if (!isDbConnected) {
    try {
      await connectToDatabase();
      console.log("Database connected successfully");
      job(); // optional background job
      isDbConnected = true;
    } catch (error) {
      console.error("Database connection failed:", error);
    }
  }
};

setup();

// Export handler for Vercel serverless function
module.exports.handler = serverless(app);
