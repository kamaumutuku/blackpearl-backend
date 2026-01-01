import mongoose from "mongoose";

/* =========================
   Order Item Snapshot
========================= */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true, // snapshot product name
    },

    image: {
      type: String,
      required: true, // snapshot image
    },

    price: {
      type: Number,
      required: true, // snapshot price
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

/* =========================
   Order Schema
========================= */
const orderSchema = new mongoose.Schema(
  {
    /* =========================
       Ownership
    ========================= */
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true, // 🔥 enables fast admin search
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    phone: {
      type: String,
      required: true, // Kenyan phone (2547XXXXXXXX)
      index: true,
    },

    /* =========================
       Items
    ========================= */
    items: {
      type: [orderItemSchema],
      required: true,
    },

    /* =========================
       Pricing
    ========================= */
    subtotal: {
      type: Number,
      required: true,
    },

    deliveryFee: {
      type: Number,
      required: true,
      default: 300, // Nairobi flat fee
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "KES",
    },

    /* =========================
       Payment
    ========================= */
    paymentMethod: {
      type: String,
      enum: ["MPESA", "STRIPE", "COD"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

    paymentReference: {
      type: String, // Mpesa CheckoutRequestID / Stripe intent ID
    },

    /* =========================
       Delivery
    ========================= */
    deliveryAddress: {
      type: String,
      required: true,
    },

    deliveryCity: {
      type: String,
      default: "Nairobi",
    },

    deliveryStatus: {
      type: String,
      enum: ["PENDING", "DISPATCHED", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },

    /* =========================
       Messaging
    ========================= */
    smsUpdatesEnabled: {
      type: Boolean,
      default: true,
    },

    /* =========================
       Meta
    ========================= */
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   Indexes
========================= */
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ phone: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ deliveryStatus: 1 });

export default mongoose.model("Order", orderSchema);
