import express from "express";
import {
  getProducts,
  getProductById,
} from "../controllers/productController.js";
const router = express.Router();

/* =========================
   PUBLIC ROUTES
========================= */

// Get all products (search, pagination, filters)
router.get("/", getProducts);

// Get single product by ID or slug
router.get("/:id", getProductById);

export default router;
