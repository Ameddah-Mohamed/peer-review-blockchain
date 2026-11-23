/**
 * Middleware factory for Role-Based Access Control (RBAC).
 * Supports alias matching: "admin" and "administrator" are treated equivalently.
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before role verification",
      });
    }

    const currentRole = req.user.role === "administrator" ? "admin" : req.user.role;
    const normalizedAllowed = allowedRoles.map((r) => (r === "administrator" ? "admin" : r));

    if (!normalizedAllowed.includes(currentRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource. Required: [${allowedRoles.join(", ")}]`,
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
  isAuthor: requireRole("author"),
  isReviewer: requireRole("reviewer"),
  isAdmin: requireRole("admin", "administrator"),
};
