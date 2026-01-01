import express from "express";
import {
  getAdminDashboard,
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminGetOrders,
  adminUpdateOrderStatus,
} from "../controllers/adminController.js";

import { protectUser, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   ADMIN DASHBOARD
========================= */
router.get("/dashboard", protectUser, protectAdmin, getAdminDashboard);

/* =========================
   ADMIN PRODUCTS
========================= */
router.get("/products", protectUser, protectAdmin, adminGetProducts);
router.post("/products", protectUser, protectAdmin, adminCreateProduct);
router.put("/products/:id", protectUser, protectAdmin, adminUpdateProduct);
router.delete("/products/:id", protectUser, protectAdmin, adminDeleteProduct);

/* =========================
   ADMIN ORDERS
========================= */
router.get("/orders", protectUser, protectAdmin, adminGetOrders);
router.put(
  "/orders/:id/status",
  protectUser,
  protectAdmin,
  adminUpdateOrderStatus
);

export default router;
