import { NextRequest, NextResponse } from "next/server";
import { encryptEmail, hashEmail, generateToken, hashToken } from "@/lib/crypto";
import {
  supabaseAdmin,
  findSubscriberByEmailHash,
  insertSubscriber,
  updateSubscriber,
} from "@/lib/supabase";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = (await req.json()) as { email?: unknown };
    if (typeof body.email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    email = body.email.trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 422 });
  }

  const db = supabaseAdmin();
  const emailHash = hashEmail(email);

  // Lookup by hash — never pass plaintext email to DB
  const existing = await findSubscriberByEmailHash(db, emailHash);

  if (existing) {
    if (existing.status === "active") {
      // Silent 200 to avoid email enumeration
      return NextResponse.json({ ok: true });
    }
    if (existing.status === "pending") {
      const confirmToken = generateToken();
      await updateSubscriber(db, existing.id, { confirm_token_hash: hashToken(confirmToken) });
      await sendConfirmationEmail(email, confirmToken);
      return NextResponse.json({ ok: true });
    }
    if (existing.status === "unsubscribed") {
      // Resubscribe path
      const confirmToken = generateToken();
      const unsubToken = generateToken();
      await updateSubscriber(db, existing.id, {
        status: "pending",
        confirm_token_hash: hashToken(confirmToken),
        unsubscribe_token_hash: hashToken(unsubToken),
        confirmed_at: null,
        unsubscribed_at: null,
      });
      await sendConfirmationEmail(email, confirmToken);
      return NextResponse.json({ ok: true });
    }
  }

  // New subscriber
  const confirmToken = generateToken();
  const unsubToken = generateToken();
  const { error: insertError } = await insertSubscriber(db, {
    encrypted_email: encryptEmail(email),
    email_hash: emailHash,
    status: "pending",
    source: "landing",
    confirm_token_hash: hashToken(confirmToken),
    unsubscribe_token_hash: hashToken(unsubToken),
    confirmed_at: null,
    unsubscribed_at: null,
  });

  if (insertError) {
    console.error("DB insert error (no PII):", insertError.code);
    return NextResponse.json({ error: "Subscription failed, please try again" }, { status: 500 });
  }

  await sendConfirmationEmail(email, confirmToken);
  return NextResponse.json({ ok: true }, { status: 201 });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
}
