const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["author", "reviewer", "admin", "administrator"],
      default: "author",
    },
    pseudonym: {
      type: String,
      unique: true,
    },
    pseudonymId: {
      type: String,
    },
    institution: {
      type: String,
      trim: true,
      default: "Independent Researcher",
    },
    expertise: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Generate deterministic/unique pseudonyms
function generatePseudonym(role, email) {
  const hash = crypto.createHash("sha256").update(email + (process.env.PSEUDONYM_SALT || "conference_salt_2026")).digest("hex").slice(0, 6).toUpperCase();
  const prefix = role === "reviewer" ? "REV" : role === "admin" || role === "administrator" ? "ADM" : "AUTH";
  return `${prefix}-${hash}`;
}

userSchema.pre("save", async function () {
  if (!this.pseudonymId) {
    this.pseudonymId = generatePseudonym(this.role, this.email);
    this.pseudonym = this.pseudonymId;
  }

  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Normalize role: "administrator" -> "admin" for frontend consistency
userSchema.methods.getNormalizedRole = function () {
  return this.role === "administrator" ? "admin" : this.role;
};

module.exports = mongoose.model("User", userSchema);
