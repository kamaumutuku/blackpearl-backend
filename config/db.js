// backend/config/db.js
import mongoose from "mongoose";

const connectDB = async (mongoUri) => {
  const uri = mongoUri || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not set");
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
