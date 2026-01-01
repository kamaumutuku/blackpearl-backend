// backend/utils/emailTemplates.js
const BRAND_COLOR = "#c7a500";
const BG = "#0b0b0b";
const FG = "#f5f5f5";
const MUTED = "#9ca3af";

function baseHtml({ title, preheader = "", bodyHtml }) {
  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${title}</title>
      <style>
        body {background: ${BG}; color: ${FG}; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;}
        .container {max-width: 680px; margin: 24px auto; padding: 28px; border-radius: 12px; background: #0f0f10; box-shadow: 0 6px 30px rgba(0,0,0,0.6);}
        .header {display:flex; align-items:center; gap:12px;}
        .logo {width:56px; height:56px; border-radius:12px; background: linear-gradient(135deg, #000, ${BRAND_COLOR}); display:flex; align-items:center; justify-content:center; color:#000; font-weight:700;}
        h1 {margin:8px 0 4px 0; font-size:20px; color:${BRAND_COLOR}}
        p {color:${MUTED}; line-height:1.45}
        .card {background:#060606; padding:16px; border-radius:10px; margin-top:14px; border:1px solid rgba(199,165,0,0.08)}
        .items {margin:12px 0 8px 0; padding:0; list-style:none}
        .items li {display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed rgba(255,255,255,0.03); color:${MUTED}}
        .cta {display:inline-block; background:${BRAND_COLOR}; color:#000; padding:10px 16px; border-radius:10px; font-weight:600; text-decoration:none}
        .muted {color:${MUTED}; font-size:13px}
        .footer {margin-top:20px; color:${MUTED}; font-size:13px}
        .meta {display:flex; gap:12px; flex-wrap:wrap; margin-top:8px}
      </style>
    </head>
    <body>
      <div class="container" role="article" aria-label="${title}">
        <div class="header">
          <div class="logo">TBP</div>
          <div>
            <h1>${title}</h1>
            <div class="muted">${preheader}</div>
          </div>
        </div>

        <div style="margin-top:12px">${bodyHtml}</div>

        <div class="footer">
          <p>The Black Pearl — Nairobi</p>
          <p class="muted">If you didn’t initiate this action, contact support or reply to this message.</p>
        </div>
      </div>
    </body>
  </html>
  `;
}

/** order confirmation template */
export function orderConfirmationTemplate({ order, subtotal, deliveryFee, total, clientUrl }) {
  const itemsHtml = (order.items || [])
    .map(
      (it) =>
        `<li><span>${it.name} × ${it.qty}</span><span>Ksh ${Number(it.price * it.qty).toLocaleString()}</span></li>`
    )
    .join("");

  const body = `
    <p class="muted">Hi ${order.user?.name || "Customer"},</p>
    <p>Thanks for your purchase — we’ve received your order <strong>#${order._id}</strong>.</p>

    <div class="card">
      <h3 style="color:${BRAND_COLOR}; margin:0 0 6px 0">Order Summary</h3>
      <ul class="items">${itemsHtml}</ul>

      <div class="meta">
        <div><strong>Subtotal:</strong> Ksh ${Number(subtotal).toLocaleString()}</div>
        <div><strong>Delivery:</strong> Ksh ${Number(deliveryFee).toLocaleString()}</div>
        <div style="font-size:16px; color:${BRAND_COLOR};"><strong>Total:</strong> Ksh ${Number(total).toLocaleString()}</div>
      </div>

      <div style="margin-top:12px">
        <div class="muted">Delivery to:</div>
        <div><strong>${order.location}</strong></div>
      </div>
    </div>

    <p style="margin-top:12px">You can view the order and track status in your profile.</p>

    <p style="margin-top:12px"><a class="cta" href="${clientUrl}/profile">View Orders</a></p>
  `;

  return {
    subject: `Order received — #${order._id}`,
    text: `Your order ${order._id} was received. Total Ksh ${Number(total).toLocaleString()}`,
    html: baseHtml({
      title: `Order #${order._id} received`,
      preheader: `Order total: Ksh ${Number(total).toLocaleString()}`,
      bodyHtml: body,
    }),
  };
}

/** status update template */
export function orderStatusTemplate({ order, status, clientUrl }) {
  const body = `
    <p class="muted">Hi ${order.user?.name || "Customer"},</p>
    <p>Your order <strong>#${order._id}</strong> status has changed to <strong style="color:${BRAND_COLOR}">${status}</strong>.</p>

    <div class="card">
      <p class="muted">Order total: <strong>Ksh ${Number(order.total || 0).toLocaleString()}</strong></p>
      <p class="muted">Delivery to: <strong>${order.location}</strong></p>
    </div>

    <p style="margin-top:12px"><a class="cta" href="${clientUrl}/orders/${order._id}">View order</a></p>
  `;

  return {
    subject: `Order ${order._id} — ${status}`,
    text: `Order ${order._id} status: ${status}`,
    html: baseHtml({
      title: `Order ${order._id} — ${status}`,
      preheader: `Order status updated`,
      bodyHtml: body,
    }),
  };
}

/** password reset template */
export function passwordResetTemplate({ userName, resetUrl }) {
  const body = `
    <p class="muted">Hi ${userName || "Customer"},</p>
    <p>We received a request to reset your password. Click the button below to reset it. The link is valid for 30 minutes.</p>

    <p style="margin-top:10px"><a class="cta" href="${resetUrl}">Reset password</a></p>

    <p style="margin-top:12px" class="muted">If you did not request a password reset, you can ignore this email.</p>
  `;

  return {
    subject: `Reset your password — The Black Pearl`,
    text: `Reset your password using this link: ${resetUrl}`,
    html: baseHtml({
      title: `Reset your password`,
      preheader: `Password reset link (expires in 30 minutes)`,
      bodyHtml: body,
    }),
  };
}
