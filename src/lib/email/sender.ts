import { Resend } from "resend";
import { renderHtml, renderPlaintext } from "./template";
import type { SendDigestOptions, SendResult } from "./types";

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "digest@bedrock.email";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://bedrock.email";
const UNSUBSCRIBE_EMAIL =
  process.env.RESEND_UNSUBSCRIBE_EMAIL ?? "unsubscribe@bedrock.email";

function buildUnsubscribeUrl(token: string): string {
  return `${BASE_URL}/unsubscribe?token=${encodeURIComponent(token)}`;
}

export async function sendDigest(opts: SendDigestOptions): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(apiKey);

  const { payload, to, unsubscribeToken } = opts;
  const unsubscribeUrl = buildUnsubscribeUrl(unsubscribeToken);
  const subject = `Bedrock Digest #${payload.issueNumber} — Week of ${payload.weekEnding}`;

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html: renderHtml(payload, unsubscribeUrl),
    text: renderPlaintext(payload, unsubscribeUrl),
    headers: {
      // RFC 2369 List-Unsubscribe + RFC 8058 one-click
      "List-Unsubscribe": `<mailto:${UNSUBSCRIBE_EMAIL}?subject=unsubscribe>, <${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }

  if (!data) {
    throw new Error("Resend returned no data and no error");
  }

  return { id: data.id, to };
}
