import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Kenyan phone number (normalized to 2547XXXXXXXX)
    phone: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // never return password by default
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    /* =========================
       AUTH / SECURITY
    ========================= */

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    // SMS OTP password reset
    resetCode: {
      type: String,
      default: null,
      select: false,
    },

    resetExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   PASSWORD HASHING
========================= */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* =========================
   PASSWORD COMPARISON
========================= */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ phone: 1 });

const User = mongoose.model("User", userSchema);

export default User;
