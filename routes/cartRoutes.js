import express from "express";
import {
  getMyCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================
   🛒 GET USER CART
   GET /api/cart
============================ */
router.get("/", protectUser, getMyCart);

/* ============================
   ➕ ADD TO CART
   POST /api/cart
   body: { productId, quantity }
============================ */
router.post("/", protectUser, addToCart);

/* ============================
   🔄 UPDATE ITEM QUANTITY
   PUT /api/cart
   body: { productId, quantity }
============================ */
router.put("/", protectUser, updateCartItem);

/* ============================
   ❌ REMOVE SINGLE ITEM
   DELETE /api/cart/:productId
============================ */
router.delete("/:productId", protectUser, removeFromCart);

/* ============================
   🧹 CLEAR ENTIRE CART
   DELETE /api/cart
============================ */
router.delete("/", protectUser, clearCart);

export default router;
