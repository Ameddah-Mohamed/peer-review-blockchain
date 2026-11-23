const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/peer_review_tracker";
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error("[MongoDB] Connection error:", error.message);
    throw error;
  }
};

module.exports = connectDB;
