import express from "express";
import {
  createStripePaymentIntent,
  stripeWebhook,
} from "../controllers/stripeController.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   STRIPE CHECKOUT (USER)
========================= */

// Create payment intent (protected)
router.post("/create-payment-intent", protectUser, createStripePaymentIntent);

/* =========================
   STRIPE WEBHOOK (PUBLIC)
========================= */

// Stripe requires raw body → handled in server.js middleware
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

export default router;
