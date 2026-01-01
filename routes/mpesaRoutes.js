import express from "express";
import {
  initiateSTKPush,
  mpesaCallback,
  querySTKStatus,
} from "../controllers/mpesaController.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   M-PESA PAYMENT ROUTES
========================= */

// Initiate STK Push (User Checkout)
router.post("/stk-push", protectUser, initiateSTKPush);

// Safaricom Callback (NO AUTH)
router.post("/callback", mpesaCallback);

// Optional: query STK push status
router.get("/status/:checkoutRequestID", protectUser, querySTKStatus);

export default router;
