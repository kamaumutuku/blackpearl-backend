import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
} from "../controllers/orderController.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 📦 Create order from cart
 * POST /api/orders
 */
router.post("/", protectUser, createOrder);

/**
 * 📜 Get my orders
 * GET /api/orders/my
 */
router.get("/my", protectUser, getMyOrders);
router.get("/myorders", protectUser, getMyOrders);

/**
 * 📄 Get single order
 * GET /api/orders/:id
 */
router.get("/:id", protectUser, getOrderById);

export default router;
