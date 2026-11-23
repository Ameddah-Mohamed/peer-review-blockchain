const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const blockchainService = require("./services/blockchainService");
const errorHandler = require("./middleware/errorHandler");

// Import Route handlers
const authRoutes = require("./routes/authRoutes");
const paperRoutes = require("./routes/paperRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const blockchainRoutes = require("./routes/blockchainRoutes");
const conferenceRoutes = require("./routes/conferenceRoutes");

const app = express();

// Security and utility middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded papers
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/papers", paperRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/conferences", conferenceRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    blockchainInitialized: blockchainService.initialized,
    contractAddress: blockchainService.contractAddress,
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to database and start server if executed directly
if (require.main === module) {
  (async () => {
    try {
      await connectDB();

      // Initialize blockchain service
      try {
        await blockchainService.initialize();
      } catch (bcErr) {
        console.warn("[Server] Blockchain initialization notice:", bcErr.message);
      }

      app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(` Research Paper Peer-Review Backend Server Running`);
        console.log(` Base URL: http://localhost:${PORT}/api`);
        console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`====================================================`);
      });
    } catch (err) {
      console.error("[Server] Fatal startup error:", err);
      process.exit(1);
    }
  })();
}

module.exports = app;
