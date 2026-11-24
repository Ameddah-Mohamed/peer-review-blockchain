const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || "conference_jwt_super_secret_2026";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role === "administrator" ? "admin" : user.role,
    },
    secret,
    { expiresIn }
  );
};

const formatUserResponse = (user) => {
  return {
    id: user._id.toString(),
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role === "administrator" ? "admin" : user.role,
    pseudonym: user.pseudonym || user.pseudonymId,
    pseudonymId: user.pseudonymId || user.pseudonym,
    institution: user.institution || "Independent Researcher",
    expertise: user.expertise || [],
  };
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, institution, expertise } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required fields",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists",
      });
    }

    let assignedRole = (role || "author").toLowerCase().trim();
    if (assignedRole === "admin" || assignedRole === "administrator") {
      return res.status(403).json({
        success: false,
        message: "Direct self-registration with administrator role is forbidden",
      });
    }
    if (!["author", "reviewer"].includes(assignedRole)) {
      assignedRole = "author";
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      institution: institution ? institution.trim() : "Independent Researcher",
      expertise: Array.isArray(expertise) ? expertise : expertise ? [expertise] : [],
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: formatUserResponse(req.user),
    });
  } catch (error) {
    next(error);
  }
};
