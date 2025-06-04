
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const authRouter = require("./routes/authRouter");
// const tokenRouter = require("./routes/tokenRouter");
const orderRouter = require("./routes/orderRouter");
const poolRouter = require("./routes/poolRouter");
const poolProcessingRouter = require("./routes/poolProcessingRouter");
const poolResultsRouter = require("./routes/poolResultsRouter");

// const authMiddleware = require("./middleware/authMiddelware");
const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DATABASE_NAME = process.env.MONGO_DATABASE_NAME;

const cors = require('cors');
const connectToDatabase = require("./configs/db");
const { job } = require("./services/scheduleService");



// CORS configuration
const corsOptions = {
  // origin: ['http://localhost:3000'], // Allow this specific origin
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] // Allowed methods
  // allowedHeaders: ['Content-Type', 'Authorization'], // Allow 'Authorization' header
};

app.use(cors(corsOptions));
// Middleware
app.use(bodyParser.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "healthy",
    message: "Server is running...",
    // timestamp: new Date().toISOString()
  });
});
// Routes
app.use("/api/auth", authRouter);
app.use("/api", orderRouter);
// app.use("/api/token", tokenRouter);
app.use("/api", poolRouter);
app.use("/api", poolProcessingRouter);
app.use("/api", poolResultsRouter);

// mongoose
//   .connect(`${MONGO_URI}`, { dbName: MONGO_DATABASE_NAME })
//   .then(async () => {
//     console.log(`"Connected to ${MONGO_DATABASE_NAME} database!"`);
//     // Start the server
//     const server = app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   })
//   .catch((err) => console.error("Database connection error:", err));

// Middleware to handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});


// Database connection wrapper
let dbConnected = false;
const connectDB = async () => {
  if (!dbConnected) {
    try {
      await connectToDatabase();
      dbConnected = true;
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Database connection failed:", error);
      throw error;
    }
  }
};

// Serverless handler with DB connection management
// const handler = async (req, res) => {
//   try {
//     await connectDB();
//     return serverless(app)(req, res);
//   } catch (error) {
//     return res.status(500).json({ 
//       error: "Internal Server Error",
//       details: "Database connection failed"
//     });
//   }
// };

// Check if running locally or in serverless environment
if (process.env.ENVIRONMENT === "development") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    try {
      await connectDB();
      console.log(`Connected to ${MONGO_DATABASE_NAME} database!`);
      console.log(`Server running on port ${PORT}`);
      // run job 
      job();
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  });
} else {
  // Export the serverless handler for Vercel
  // module.exports.handler = handler;
}