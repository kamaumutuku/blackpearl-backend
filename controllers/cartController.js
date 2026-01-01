import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

/* ============================
   🛒 GET USER CART
============================ */
export const getMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      select: "name price image images",
    });

    if (!cart) {
      return res.json({ items: [] });
    }

    const items = cart.items
      .filter((i) => i.product)
      .map((i) => ({
        product: {
          _id: i.product._id,
          name: i.product.name,
          price: i.product.price,
          image:
            i.product.image ||
            i.product.images?.[0] ||
            "https://via.placeholder.com/100",
        },
        quantity: i.quantity,
      }));

    res.json({ items });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
};

/* ============================
   ➕ ADD TO CART
============================ */
export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ message: "Product and quantity required" });
    }

    /* =========================
       FETCH PRODUCT SNAPSHOT
    ========================= */
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    /* =========================
       GET / CREATE CART
    ========================= */
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
      });
    }

    /* =========================
       CHECK IF ITEM EXISTS
    ========================= */
    const existingItem = cart.items.find(
      (i) => i.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,                         // ✅ snapshot
        image: product.images?.[0] || "",           // ✅ snapshot
        price: product.price,                       // ✅ snapshot
        quantity: Number(quantity),
      });
    }

    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Failed to add to cart" });
  }
};

/* ============================
   🔄 UPDATE ITEM QUANTITY
============================ */
export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || typeof quantity !== "number") {
      return res
        .status(400)
        .json({ message: "productId and quantity are required" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      (i) => i.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(
        (i) => i.product.toString() !== productId
      );
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    res.json({ message: "Cart updated" });
  } catch (err) {
    console.error("Update cart error:", err);
    res.status(500).json({ message: "Failed to update cart" });
  }
};

/* ============================
   ❌ REMOVE ITEM
============================ */
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (i) => i.product.toString() !== productId
    );

    await cart.save();
    res.json({ message: "Item removed" });
  } catch (err) {
    console.error("Remove cart error:", err);
    res.status(500).json({ message: "Failed to remove item" });
  }
};

/* ============================
   🧹 CLEAR CART
============================ */
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    console.error("Clear cart error:", err);
    res.status(500).json({ message: "Failed to clear cart" });
  }
};
