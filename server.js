import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import logger from "./config/logger.js";

// Routes (NO admin routes)
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import mpesaRoutes from "./routes/mpesaRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Load env
dotenv.config();

// Connect DB
connectDB();

const app = express();

/* =========================
   Global Middleware
========================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* =========================
   Health Check
========================= */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

/* =========================
   API Routes
========================= */
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/mpesa", mpesaRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/admin", adminRoutes);

/* =========================
   404 Handler
========================= */
app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

/* =========================
   Global Error Handler
========================= */
app.use((err, req, res, next) => {
  logger.error(err.stack);

  res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

/* =========================
   Server
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

export default app;
