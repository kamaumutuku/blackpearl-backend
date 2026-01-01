import mongoose from "mongoose";

/* =========================
   Product Schema
========================= */
const productSchema = new mongoose.Schema(
  {
    /* =========================
       Core Info
    ========================= */
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },

    /* =========================
       Media
    ========================= */
    images: [
      {
        type: String, // Cloudinary URLs
        required: true,
      },
    ],

    /* =========================
       Pricing
    ========================= */
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    compareAtPrice: {
      type: Number, // optional “was price”
    },

    currency: {
      type: String,
      default: "KES",
    },

    /* =========================
       Inventory
    ========================= */
    countInStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    sku: {
      type: String,
      unique: true,
      sparse: true,
    },

    /* =========================
       Category & Filtering
    ========================= */
    category: {
      type: String,
      required: true,
      index: true,
    },

    tags: [
      {
        type: String,
        index: true,
      },
    ],

    /* =========================
       Alcohol / Compliance
    ========================= */
    alcoholPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    volumeMl: {
      type: Number, // e.g. 750ml
    },

    ageRestricted: {
      type: Boolean,
      default: true, // alcohol products
    },

    /* =========================
       SEO
    ========================= */
    seo: {
      title: {
        type: String,
      },
      description: {
        type: String,
      },
      keywords: [
        {
          type: String,
        },
      ],
    },

    /* =========================
       Visibility
    ========================= */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* =========================
       Analytics
    ========================= */
    soldCount: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   Indexes
========================= */
productSchema.index({ name: "text", description: "text" });
productSchema.index({ price: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });

export default mongoose.model("Product", productSchema);
