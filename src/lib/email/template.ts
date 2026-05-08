import type { DigestItem, DigestPayload } from "./types";

function formatWeekEnding(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemBlockHtml(item: DigestItem, index: number): string {
  return `
    <tr>
      <td style="padding:24px 0 0;">
        <p style="margin:0 0 4px;font-size:11px;color:#888;font-family:sans-serif;text-transform:uppercase;letter-spacing:.06em;">
          ${escapeHtml(item.source)}
        </p>
        <h2 style="margin:0 0 10px;font-size:18px;line-height:1.3;font-family:Georgia,serif;color:#1a1a1a;">
          <a href="${escapeHtml(item.url)}" style="color:#1a1a1a;text-decoration:none;">${escapeHtml(item.title)}</a>
        </h2>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#444;font-family:sans-serif;">${escapeHtml(item.summary)}</p>
        <p style="margin:10px 0 0;font-size:13px;font-family:sans-serif;">
          <a href="${escapeHtml(item.url)}" style="color:#2563eb;">Read more &rarr;</a>
        </p>
        ${index > 0 ? '<hr style="border:none;border-top:1px solid #e5e7eb;margin-top:24px;">' : ""}
      </td>
    </tr>
  `;
}

export function renderHtml(
  payload: DigestPayload,
  unsubscribeUrl: string
): string {
  const weekLabel = formatWeekEnding(payload.weekEnding);
  const itemsHtml = payload.items
    .map((item, i) => itemBlockHtml(item, i))
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Bedrock Digest #${payload.issueNumber}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" style="max-width:600px;width:100%;background:#fff;border-radius:8px;overflow:hidden;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:28px 40px;">
              <p style="margin:0;font-size:13px;color:#888;font-family:sans-serif;text-transform:uppercase;letter-spacing:.1em;">Issue #${payload.issueNumber} &middot; Week of ${weekLabel}</p>
              <h1 style="margin:8px 0 0;font-size:28px;color:#fff;font-family:Georgia,serif;letter-spacing:-.01em;">Bedrock Digest</h1>
              <p style="margin:6px 0 0;font-size:14px;color:#aaa;font-family:sans-serif;">The best Product Design &times; AI stories, curated weekly.</p>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:8px 40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f5f4;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#999;font-family:sans-serif;line-height:1.6;">
                You received this email because you subscribed to Bedrock Digest.<br>
                <a href="${escapeHtml(unsubscribeUrl)}" style="color:#999;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderPlaintext(
  payload: DigestPayload,
  unsubscribeUrl: string
): string {
  const weekLabel = formatWeekEnding(payload.weekEnding);
  const divider = "─".repeat(60);

  const itemsText = payload.items
    .map(
      (item, i) =>
        `${i + 1}. ${item.title.toUpperCase()}\n   ${item.source}\n\n   ${item.summary}\n\n   ${item.url}`
    )
    .join(`\n\n${divider}\n\n`);

  return `BEDROCK DIGEST — Issue #${payload.issueNumber}
Week of ${weekLabel}

The best Product Design × AI stories, curated weekly.

${divider}

${itemsText}

${divider}

To unsubscribe: ${unsubscribeUrl}
`;
}
