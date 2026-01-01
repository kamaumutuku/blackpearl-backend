import axios from "axios";
import Order from "../models/Order.js";
import { sendSMS } from "../utils/twilio.js";

/* =========================
   MPESA CONFIG
========================= */

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL,
  MPESA_ENV,
} = process.env;

const MPESA_BASE_URL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

/* =========================
   HELPERS
========================= */

const getAccessToken = async () => {
  const auth = Buffer.from(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const { data } = await axios.get(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  return data.access_token;
};

const generatePassword = () => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);

  const password = Buffer.from(
    `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  return { password, timestamp };
};

/* =========================
   INITIATE STK PUSH
========================= */

export const initiateSTKPush = async (req, res) => {
  try {
    const { orderId, phone } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ message: "Order not found" });

    const token = await getAccessToken();
    const { password, timestamp } = generatePassword();

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: order.totalPrice,
      PartyA: phone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: order._id.toString(),
      TransactionDesc: "The Black Pearl Order Payment",
    };

    const { data } = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    order.paymentMethod = "MPESA";
    order.mpesaCheckoutRequestID = data.CheckoutRequestID;
    await order.save();

    res.json({
      message: "STK push sent successfully",
      CheckoutRequestID: data.CheckoutRequestID,
    });
  } catch (error) {
    console.error("MPESA STK Error:", error?.response?.data || error.message);
    res.status(500).json({ message: "Failed to initiate MPESA payment" });
  }
};

/* =========================
   MPESA CALLBACK
========================= */

export const mpesaCallback = async (req, res) => {
  try {
    const callback =
      req.body.Body.stkCallback;

    const checkoutId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;

    const order = await Order.findOne({
      mpesaCheckoutRequestID: checkoutId,
    });

    if (!order) return res.json({ ResultCode: 0 });

    if (resultCode === 0) {
      order.isPaid = true;
      order.paidAt = new Date();
      await order.save();

      if (order.phone) {
        await sendSMS(
          order.phone,
          `Payment received for order ${order._id}. Thank you for shopping with The Black Pearl 🖤`
        );
      }
    }

    res.json({ ResultCode: 0 });
  } catch (err) {
    console.error("MPESA Callback Error:", err.message);
    res.json({ ResultCode: 0 });
  }
};

/* =========================
   QUERY STK STATUS ✅ (FIX)
========================= */

export const querySTKStatus = async (req, res) => {
  try {
    const { checkoutRequestID } = req.params;

    const token = await getAccessToken();
    const { password, timestamp } = generatePassword();

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID,
    };

    const { data } = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(data);
  } catch (error) {
    console.error("STK Query Error:", error?.response?.data || error.message);
    res.status(500).json({ message: "Failed to query STK status" });
  }
};
