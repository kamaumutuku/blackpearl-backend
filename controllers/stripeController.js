import Stripe from "stripe";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ==============================
   CREATE STRIPE PAYMENT INTENT
============================== */
/**
 * POST /api/stripe/create-payment-intent
 * USER AUTH REQUIRED
 */
export const createStripePaymentIntent = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch cart
    const cart = await Cart.findOne({ user: userId }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate total (server-trusted)
    const amount = cart.items.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid cart amount" });
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: userId.toString(),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Stripe intent error:", err);
    res.status(500).json({ message: "Stripe payment failed" });
  }
};

/* ==============================
   STRIPE WEBHOOK (OPTIONAL BUT RECOMMENDED)
============================== */
/**
 * POST /api/stripe/webhook
 * RAW BODY REQUIRED
 */
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;

    try {
      const userId = intent.metadata.userId;

      const cart = await Cart.findOne({ user: userId }).populate(
        "items.product"
      );

      if (!cart) return res.json({ received: true });

      const order = await Order.create({
        user: userId,
        items: cart.items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalAmount: intent.amount_received / 100,
        paymentMethod: "stripe",
        paymentStatus: "paid",
        orderStatus: "processing",
      });

      // Clear cart after order creation
      cart.items = [];
      await cart.save();

      console.log("Stripe order created:", order._id);
    } catch (err) {
      console.error("Order creation failed:", err);
    }
  }

  res.json({ received: true });
};
