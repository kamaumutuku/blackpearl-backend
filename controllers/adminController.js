import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import slugify from "slugify";

/* =========================
   DASHBOARD STATS
========================= */
export const getAdminDashboard = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    const orders = await Order.find();

    // ✅ Revenue MUST use totalAmount (schema correct)
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    // ✅ Pending orders based on deliveryStatus enum
    const pendingOrders = orders.filter(
      (order) => order.deliveryStatus === "PENDING"
    ).length;

    // ✅ Frontend-compatible payment breakdown
    const paymentBreakdown = {
      cash: 0,
      mpesa: 0,
      stripe: 0,
    };

    orders.forEach((order) => {
      if (order.paymentMethod === "COD") {
        paymentBreakdown.cash += order.totalAmount || 0;
      }
      if (order.paymentMethod === "MPESA") {
        paymentBreakdown.mpesa += order.totalAmount || 0;
      }
      if (order.paymentMethod === "STRIPE") {
        paymentBreakdown.stripe += order.totalAmount || 0;
      }
    });

    res.json({
      totalOrders,
      totalRevenue,
      totalProducts,
      totalUsers,
      pendingOrders,
      paymentBreakdown,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ message: "Failed to load admin dashboard" });
  }
};

/* =========================
   PRODUCTS (ADMIN)
========================= */
export const adminGetProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

export const adminCreateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      images,
      price,
      countInStock,
      category,
      tags,
      alcoholPercentage,
      volumeMl,
      isFeatured,
    } = req.body;

    if (!name || !description || !images?.length || !price || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const exists = await Product.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: "Product already exists" });
    }

    const product = await Product.create({
      name,
      slug,
      description,
      images,
      price,
      countInStock: countInStock || 0,
      category,
      tags: tags || [],
      alcoholPercentage,
      volumeMl,
      isFeatured: !!isFeatured,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Admin create product error:", err);
    res.status(500).json({ message: "Failed to create product" });
  }
};

export const adminUpdateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    Object.assign(product, req.body);

    if (req.body.name) {
      product.slug = slugify(req.body.name, {
        lower: true,
        strict: true,
      });
    }

    const updated = await product.save();
    res.json(updated);
  } catch (err) {
    console.error("Admin update product error:", err);
    res.status(500).json({ message: "Failed to update product" });
  }
};

export const adminDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product" });
  }
};

/* =========================
   ORDERS (ADMIN)
========================= */
export const adminGetOrders = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    /* =========================
       DELIVERY STATUS FILTER
    ========================= */
    if (req.query.deliveryStatus) {
      query.deliveryStatus = req.query.deliveryStatus;
    }

    /* =========================
       PAYMENT METHOD FILTER
    ========================= */
    if (req.query.paymentMethod) {
      query.paymentMethod = req.query.paymentMethod;
    }

    /* =========================
       SEARCH (ORDER NUMBER / PHONE)
    ========================= */
    if (req.query.search) {
      query.$or = [
        { orderNumber: { $regex: req.query.search, $options: "i" } },
        { phone: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const totalOrders = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate("user", "name phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      orders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error("Admin orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


export const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.deliveryStatus = status;
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to update order status" });
  }
};
