const errorHandler = (err, req, res, next) => {
  console.error("[ErrorHandler]", err);

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Uploaded file is too large. Maximum size allowed is 25MB.",
      });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: "Database validation failed",
      errors: messages,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field '${field}'. Record already exists.`,
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error occurred",
  });
};

module.exports = errorHandler;
