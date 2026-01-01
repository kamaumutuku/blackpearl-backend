// backend/utils/sendEmail.js
import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const FROM = process.env.EMAIL_FROM || "The Black Pearl <no-reply@theblackpearl.example>";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

async function sendViaSendGrid({ to, subject, text, html }) {
  const msg = { to, from: FROM, subject, text, html };
  await sgMail.send(msg);
  return { provider: "sendgrid" };
}

async function sendViaGmailOAuth({ to, subject, text, html }) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );
  oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  const accessTokenRes = await oAuth2Client.getAccessToken();
  const accessToken = accessTokenRes?.token || accessTokenRes;
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken,
    },
  });

  await transport.sendMail({ from: FROM, to, subject, text, html });
  return { provider: "gmail-oauth2" };
}

async function sendViaSMTP({ to, subject, text, html }) {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transport.sendMail({ from: FROM, to, subject, text, html });
  return { provider: "smtp" };
}

/**
 * sendEmail(opts)
 * opts: { to, subject, text, html } OR opts.template (object returned from templates)
 */
export default async function sendEmail(opts = {}) {
  try {
    const payload = {};
    if (opts.template && typeof opts.template === "object") {
      payload.subject = opts.template.subject;
      payload.text = opts.template.text;
      payload.html = opts.template.html;
      payload.to = opts.to || opts.template.to;
    } else {
      payload.subject = opts.subject;
      payload.text = opts.text;
      payload.html = opts.html;
      payload.to = opts.to;
    }

    if (!payload.to) throw new Error("No recipient (to) provided for email.");

    // Try SendGrid first
    if (process.env.SENDGRID_API_KEY) {
      try {
        return await sendViaSendGrid(payload);
      } catch (e) {
        console.error("SendGrid failed:", e?.response?.body || e.message || e);
      }
    }

    // Gmail OAuth2 fallback
    if (
      process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN &&
      process.env.GMAIL_USER
    ) {
      try {
        return await sendViaGmailOAuth(payload);
      } catch (e) {
        console.error("Gmail OAuth2 failed:", e.message || e);
      }
    }

    // SMTP fallback
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        return await sendViaSMTP(payload);
      } catch (e) {
        console.error("SMTP fallback failed:", e.message || e);
      }
    }

    throw new Error("No email provider configured or all providers failed.");
  } catch (err) {
    console.error("sendEmail error:", err.message || err);
    throw err;
  }
}
