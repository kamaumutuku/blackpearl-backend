import express from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";

import { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   AUTH
========================= */

// Register (phone + password)
router.post("/register", registerUser);

// Login (phone + password)
router.post("/login", loginUser);

// Refresh access token
router.post("/refresh", refreshToken);

// Logout
router.post("/logout", logoutUser);

/* =========================
   PROFILE
========================= */

router.get("/profile", protectUser, getUserProfile);
router.put("/profile", protectUser, updateUserProfile);
router.delete("/delete", protectUser, deleteUser);

/* =========================
   PASSWORD RESET (SMS)
========================= */

// Send SMS reset code
router.post("/forgot-password", forgotPassword);

// Verify code + set new password
router.post("/reset-password", resetPassword);

export default router;
