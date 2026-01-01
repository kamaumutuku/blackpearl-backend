import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

/* ============================
   CREATE ORDER
   POST /api/orders
============================ */

const generateOrderNumber = async () => {
  const count = await Order.countDocuments();
  return `BP-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;
};

export const createOrder = async (req, res) => {
  try {
    const orderNumber = await generateOrderNumber();

    let {
      paymentMethod = "COD",
      county,
      town,
      notes,
      smsUpdatesEnabled = true,
    } = req.body;

    if (!county || !town) {
      return res.status(400).json({
        message: "Delivery location is required",
      });
    }

    // Normalize payment method to enum-safe values
    paymentMethod = paymentMethod.toUpperCase();
    if (!["COD", "MPESA", "STRIPE"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // 1️⃣ Load cart
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let subtotal = 0;
    const orderItems = [];

    // 2️⃣ Validate stock & snapshot products
    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        return res.status(400).json({
          message: "One or more products no longer exist",
        });
      }

      if (product.countInStock < item.quantity) {
        return res.status(400).json({
          message: `${product.name} is out of stock`,
        });
      }

      subtotal += product.price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        image:
          product.images?.[0] ||
          "https://via.placeholder.com/400x400?text=No+Image",
        price: product.price,
        quantity: item.quantity,
      });
    }

    const deliveryFee = 300;
    const totalAmount = subtotal + deliveryFee;

    // 3️⃣ Create order
    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      phone: req.user.phone,
      items: orderItems,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod,
      paymentStatus: "PENDING",
      deliveryAddress: `${town}, ${county}`,
      deliveryCity: "Nairobi",
      notes,
      smsUpdatesEnabled,
    });

    // 4️⃣ Reduce stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { countInStock: -item.quantity },
      });
    }

    // 5️⃣ Clear cart
    await Cart.findOneAndDelete({ user: req.user._id });

    res.status(201).json({
      message: "Order placed successfully",
      orderId: order._id,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
};



/* ============================
   GET MY ORDERS
   GET /api/orders/my
   GET /api/orders/myorders  ✅
============================ */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(orders);
  } catch (err) {
    console.error("Get my orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/* ============================
   GET ORDER BY ID
============================ */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name phone"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
};
