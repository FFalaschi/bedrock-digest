import { NextRequest, NextResponse } from "next/server";
import { sendDigest } from "@/lib/email/sender";
import type { DigestPayload } from "@/lib/email/types";

// Shared secret to gate this endpoint; set DIGEST_SEND_SECRET in env
const SEND_SECRET = process.env.DIGEST_SEND_SECRET;

export async function POST(request: NextRequest) {
  // Simple bearer-token auth to prevent unauthenticated triggers
  const auth = request.headers.get("authorization") ?? "";
  if (!SEND_SECRET || auth !== `Bearer ${SEND_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { to: string | string[]; payload: DigestPayload; unsubscribeToken: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { to, payload, unsubscribeToken } = body;
  if (!to || !payload || !unsubscribeToken) {
    return NextResponse.json(
      { error: "Missing required fields: to, payload, unsubscribeToken" },
      { status: 400 }
    );
  }

  try {
    const result = await sendDigest({ to, payload, unsubscribeToken });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
