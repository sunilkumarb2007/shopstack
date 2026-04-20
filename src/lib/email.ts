import { Resend } from "resend";
import { formatCurrency } from "@/lib/utils";

type OrderItemLine = {
  name: string;
  quantity: number;
  unitPriceCents: number;
};

type OrderReceiptInput = {
  to: string;
  orderNumber: string;
  storeName: string;
  items: OrderItemLine[];
  subtotalCents: number;
  totalCents: number;
  currency: string;
  orderUrl: string;
};

export async function sendOrderReceipt(input: OrderReceiptInput) {
  const from = process.env.RESEND_FROM_EMAIL ?? "ShopStack <noreply@example.com>";
  const apiKey = process.env.RESEND_API_KEY;

  const subject = `Your ${input.storeName} order #${input.orderNumber}`;
  const html = renderReceiptHtml(input);

  if (!apiKey) {
    // Fallback: log to server console so local dev still exercises this path.
    console.info("[email:stub]", { to: input.to, from, subject, html });
    return { id: "stub", skipped: true as const };
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: input.to,
    subject,
    html,
  });
  if (result.error) {
    console.error("[email] Resend error", result.error);
    throw new Error(result.error.message);
  }
  return { id: result.data?.id ?? "unknown", skipped: false as const };
}

function renderReceiptHtml(input: OrderReceiptInput): string {
  const rows = input.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(i.name)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(i.unitPriceCents * i.quantity, input.currency)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#fafafa;padding:24px;color:#111">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:8px;padding:24px">
      <h1 style="margin:0 0 8px 0;font-size:22px">Thanks for your order!</h1>
      <p style="margin:0 0 16px 0;color:#555">${escapeHtml(input.storeName)} · Order #${escapeHtml(input.orderNumber)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:2px solid #111">Item</th>
            <th style="text-align:center;padding:8px;border-bottom:2px solid #111">Qty</th>
            <th style="text-align:right;padding:8px;border-bottom:2px solid #111">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:8px;text-align:right;color:#555">Subtotal</td>
            <td style="padding:8px;text-align:right">${formatCurrency(input.subtotalCents, input.currency)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:8px;text-align:right;font-weight:600">Total</td>
            <td style="padding:8px;text-align:right;font-weight:600">${formatCurrency(input.totalCents, input.currency)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin:24px 0 0 0">
        <a href="${escapeAttr(input.orderUrl)}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">View your order</a>
      </p>
      <p style="margin-top:24px;color:#888;font-size:12px">Sent by ShopStack on behalf of ${escapeHtml(input.storeName)}.</p>
    </div>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
