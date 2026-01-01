import twilio from "twilio";

/**
 * Twilio client
 */
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Normalize Kenyan phone number
 * 0700xxxxxx → 254700xxxxxx
 * +254700xxxxxx → 254700xxxxxx
 */
export const normalizePhone = (phone) => {
  if (!phone) return null;

  let p = phone.replace(/\s+/g, "");

  if (p.startsWith("0")) return "254" + p.slice(1);
  if (p.startsWith("+")) return p.slice(1);

  return p;
};

/**
 * Send SMS (DEFAULT EXPORT)
 * This fixes your error
 */
export const sendSMS = async ({ to, message }) => {
  try {
    const normalizedPhone = normalizePhone(to);

    if (!normalizedPhone) {
      throw new Error("Invalid phone number");
    }

    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+${normalizedPhone}`,
    });

    return sms;
  } catch (error) {
    console.error("❌ Twilio SMS Error:", error.message);
    throw new Error("Failed to send SMS");
  }
};

export default sendSMS;

/**
 * Convenience helpers (OPTIONAL BUT CLEAN)
 */

export const sendOrderStatusSMS = async (phone, orderId, status) => {
  return sendSMS({
    to: phone,
    message: `🛒 The Black Pearl\nYour order ${orderId} is now ${status}.`,
  });
};

export const sendPasswordResetSMS = async (phone, code) => {
  return sendSMS({
    to: phone,
    message: `🔐 The Black Pearl\nYour password reset code is ${code}. Expires in 10 minutes.`,
  });
};

export const sendOTP = async (phone, code) => {
  return sendSMS({
    to: phone,
    message: `🔑 The Black Pearl\nYour verification code is ${code}.`,
  });
};
