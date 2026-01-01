import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendSMS from "../utils/twilio.js";

/* =========================
   CONFIG
========================= */
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}-refresh`;

/* =========================
   HELPERS
========================= */

// Normalize Kenyan phone numbers
// 0712345678 → 254712345678
// +254712345678 → 254712345678
const normalizePhone = (phone) => {
  let p = phone.replace(/\s+/g, "");
  if (p.startsWith("0")) return "254" + p.slice(1);
  if (p.startsWith("+")) return p.slice(1);
  return p;
};

// ✅ INCLUDE ROLE IN JWT
const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "45min" }
  );

const generateRefreshToken = (id) =>
  jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

/* =========================
   REGISTER
========================= */
export const registerUser = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const normalizedPhone = normalizePhone(phone);

    const exists = await User.findOne({ phone: normalizedPhone });
    if (exists) {
      return res.status(409).json({ message: "Phone already registered." });
    }

    const user = await User.create({
      name,
      phone: normalizedPhone,
      password,
      role: "user",
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("jwt_refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      token: accessToken,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed." });
  }
};

/* =========================
   LOGIN
========================= */
export const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password required." });
    }

    const normalizedPhone = normalizePhone(phone);

    const user = await User.findOne({ phone: normalizedPhone }).select("+password");

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("jwt_refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      token: accessToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed." });
  }
};

/* =========================
   REFRESH TOKEN
========================= */
export const refreshToken = async (req, res) => {
  const token = req.cookies?.jwt_refresh;
  if (!token) return res.status(401).json({ message: "No refresh token." });

  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token." });
    }

    const newAccess = generateAccessToken(user);
    const newRefresh = generateRefreshToken(user._id);

    user.refreshToken = newRefresh;
    await user.save();

    res.cookie("jwt_refresh", newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ token: newAccess });
  } catch {
    res.status(403).json({ message: "Refresh token expired." });
  }
};

/* =========================
   LOGOUT
========================= */
export const logoutUser = async (req, res) => {
  const token = req.cookies?.jwt_refresh;

  if (token) {
    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  }

  res.clearCookie("jwt_refresh");
  res.json({ message: "Logged out successfully." });
};

/* =========================
   PROFILE
========================= */
export const getUserProfile = async (req, res) => {
  res.json(req.user);
};

export const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (req.body.name) user.name = req.body.name;

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
  }

  const updated = await user.save();

  res.json({
    _id: updated._id,
    name: updated.name,
    phone: updated.phone,
    role: updated.role,
    token: generateAccessToken(updated),
  });
};

/* =========================
   DELETE ACCOUNT
========================= */
export const deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.json({ message: "Account deleted successfully." });
};

/* =========================
   FORGOT PASSWORD (SMS)
========================= */
export const forgotPassword = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Phone is required." });

  const normalizedPhone = normalizePhone(phone);
  const user = await User.findOne({ phone: normalizedPhone });

  if (!user) {
    return res.status(404).json({ message: "Account not found." });
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendSMS(
    normalizedPhone,
    `The Black Pearl: Your password reset code is ${resetCode}`
  );

  res.json({ message: "Reset code sent via SMS." });
};

/* =========================
   RESET PASSWORD (SMS)
========================= */
export const resetPassword = async (req, res) => {
  const { phone, code, password } = req.body;

  const hashedCode = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");

  const normalizedPhone = normalizePhone(phone);

  const user = await User.findOne({
    phone: normalizedPhone,
    resetPasswordToken: hashedCode,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset code." });
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({ message: "Password reset successful." });
};
