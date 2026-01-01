import mongoose from "mongoose";

/* ==========================
   CART ITEM (SNAPSHOT)
========================== */
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false }
);

/* ==========================
   CART
========================== */
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one cart per user
    },

    items: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);

/* ==========================
   INDEXES
========================== */
cartSchema.index({ user: 1 });

export default mongoose.model("Cart", cartSchema);
