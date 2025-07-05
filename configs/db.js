const mongoose = require("mongoose");
const { logger } = require("../logger");
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DATABASE_NAME,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      maxPoolSize: 50,
      retryWrites: true,
      w: 'majority'
    });
    // console.log("✅ Connected to MongoDB successfully");
    logger.info("✅ Connected to MongoDB successfully");
    return mongoose.connection;
  } catch (error) {
    // console.error("❌ MongoDB connection failed:", error.message);
    logger.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectToDatabase; // Export directly as function