import type { Order, OrderItem } from "@prisma/client";

export type EmailOrder = Pick<
  Order,
  | "id" | "orderNumber" | "customerName" | "customerPhone" | "customerEmail"
  | "address" | "shippingMethod" | "shippingCost" | "subtotal" | "total"
  | "paymentMethod" | "notes" | "createdAt"
> & {
  items: Pick<OrderItem, "productName" | "selectedSize" | "color" | "quantity" | "unitPrice" | "totalPrice">[];
};

export interface OrderEmailConfig {
  from: string;
  adminEmail: string;
  replyTo: string;
  siteUrl: string;
}

export interface OrderEmailMessage {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]!));
}

function money(value: number): string {
  return `BDT ${value.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function detail(label: string, value: string): string {
  return `<p style="margin:8px 0;overflow-wrap:anywhere"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value).replace(/\r?\n/g, "<br>")}</p>`;
}

export function buildOrderEmails(order: EmailOrder, config: OrderEmailConfig): OrderEmailMessage[] {
  const date = order.createdAt.toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short",
  });
  const shipping = order.shippingMethod === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka";
  const payment = order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod;
  const itemRows = order.items.map((item) => {
    const variants = [item.selectedSize && `Size: ${item.selectedSize}`, item.color && `Color: ${item.color}`]
      .filter(Boolean).join(" · ");
    return `<tr>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;overflow-wrap:anywhere">${escapeHtml(item.productName)}${variants ? `<br><span style="font-size:12px;color:#6b7280">${escapeHtml(variants)}</span>` : ""}<br><span style="font-size:12px;color:#6b7280">${money(item.unitPrice)} each</span></td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${money(item.totalPrice)}</td>
    </tr>`;
  }).join("");
  const summary = `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
    <thead><tr style="background:#f3f4f6"><th align="left" style="padding:10px 8px">Item</th><th style="padding:10px 8px">Qty</th><th align="right" style="padding:10px 8px">Amount</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px">
    <tr><td style="padding:4px 0">Subtotal</td><td align="right">${money(order.subtotal)}</td></tr>
    <tr><td style="padding:4px 0">Shipping (${shipping})</td><td align="right">${money(order.shippingCost)}</td></tr>
    <tr><td style="padding:12px 0;font-weight:bold;font-size:18px">Total</td><td align="right" style="font-weight:bold;font-size:18px">${money(order.total)}</td></tr>
  </table>`;
  const textSummary = order.items.map((item) => [
    item.productName,
    item.selectedSize ? `Size: ${item.selectedSize}` : null,
    item.color ? `Color: ${item.color}` : null,
    `Quantity: ${item.quantity} | Unit price: ${money(item.unitPrice)} | Amount: ${money(item.totalPrice)}`,
  ].filter(Boolean).join("\n")).join("\n\n");
  const deliveryHtml = detail("Customer", order.customerName)
    + detail("Phone", order.customerPhone)
    + detail("Delivery address", order.address)
    + detail("Payment", payment)
    + (order.notes ? detail("Order notes", order.notes) : "");
  const sharedText = [
    `Order: ${order.orderNumber}`, `Placed: ${date} (Bangladesh time)`, "", textSummary, "",
    `Subtotal: ${money(order.subtotal)}`, `Shipping (${shipping}): ${money(order.shippingCost)}`,
    `Total: ${money(order.total)}`, `Payment: ${payment}`, "",
    `Customer: ${order.customerName}`, `Phone: ${order.customerPhone}`,
    `Delivery address: ${order.address}`, order.notes ? `Order notes: ${order.notes}` : "",
  ].filter((line) => line !== undefined).join("\n");

  function message(admin: boolean, recipient: string): OrderEmailMessage {
    const title = admin ? "New order received" : "Thank you for your order!";
    const introduction = admin
      ? "A new order is awaiting review and confirmation."
      : `Hi ${order.customerName}, we have received your order. Our team will review and confirm it shortly.`;
    const url = new URL(admin ? "/admin/orders" : "/track-order", config.siteUrl);
    url.searchParams.set(admin ? "search" : "order", order.orderNumber);
    if (admin) url.searchParams.set("status", "ALL");
    else url.searchParams.set("phone", order.customerPhone);
    const button = admin ? "Review order" : "Track your order";
    const footer = admin
      ? "Reply to this email to contact the customer."
      : `Use your order number and checkout phone number to track your order. For help, reply to this email. ${payment === "Cash on Delivery" ? `Please pay ${money(order.total)} upon delivery.` : ""}`;
    return {
      from: config.from,
      to: [recipient],
      reply_to: admin ? (order.customerEmail || config.replyTo) : config.replyTo,
      subject: admin
        ? `New order ${order.orderNumber} | ${money(order.total)} | 3DifyBD`
        : `Order received — ${order.orderNumber} | 3DifyBD`,
      html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px"><tr><td style="padding:28px 20px">
        <p style="margin:0;color:#4f46e5;font-size:22px;font-weight:bold">3DifyBD</p>
        <h1 style="font-size:24px;margin:20px 0 12px">${title}</h1>
        <p style="line-height:1.6">${escapeHtml(introduction)}</p>
        ${detail("Order number", order.orderNumber)}${detail("Placed", `${date} (Bangladesh time)`)}
        <h2 style="font-size:18px;margin-top:24px">Order summary</h2>${summary}
        <h2 style="font-size:18px">Delivery details</h2>${deliveryHtml}
        ${admin && order.customerEmail ? detail("Email", order.customerEmail) : ""}
        <p style="margin:24px 0"><a href="${escapeHtml(url.href)}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">${button}</a></p>
        <p style="font-size:13px;line-height:1.6;color:#6b7280">${escapeHtml(footer)}</p>
        </td></tr></table></td></tr></table></body></html>`,
      text: ["3DifyBD", title, introduction, "", sharedText,
        admin && order.customerEmail ? `Email: ${order.customerEmail}` : "",
        "", `${button}: ${url.href}`, "", footer,
      ].join("\n"),
    };
  }

  return [
    ...(order.customerEmail ? [message(false, order.customerEmail)] : []),
    message(true, config.adminEmail),
  ];
}
