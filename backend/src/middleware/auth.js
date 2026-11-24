const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing or invalid format (Bearer token required)",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const secret = process.env.JWT_SECRET || "conference_jwt_super_secret_2026";

    let user;

    if (token.startsWith("demo_token_") || token.startsWith("mock_")) {
      // Support demo roles for seamless frontend switcher in development
      let targetRole = "author";
      if (token.includes("admin") || token.includes("0001") || token.includes("chair")) {
        targetRole = "admin";
      } else if (token.includes("rev") || token.includes("0002") || token.includes("smith")) {
        targetRole = "reviewer";
      }

      user = await User.findOne({
        role: targetRole === "admin" ? { $in: ["admin", "administrator"] } : targetRole,
      });

      if (!user) {
        user = await User.findOne();
      }
    } else {
      let decoded;
      try {
        decoded = jwt.verify(token, secret);
      } catch (jwtErr) {
        return res.status(401).json({
          success: false,
          message: jwtErr.name === "TokenExpiredError" ? "Token has expired" : "Invalid authentication token",
        });
      }

      user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User associated with token no longer exists",
        });
      }
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role === "administrator" ? "admin" : user.role;

    next();
  } catch (error) {
    console.error("[AuthMiddleware] Error:", error);
    res.status(500).json({ success: false, message: "Internal authentication error" });
  }
};

module.exports = auth;
