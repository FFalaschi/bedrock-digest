import { NextRequest, NextResponse } from "next/server";
import { hashToken } from "@/lib/crypto";
import {
  supabaseAdmin,
  findSubscriberByUnsubToken,
  updateSubscriber,
} from "@/lib/supabase";

// One-click unsubscribe — no auth required, token proves intent
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return NextResponse.redirect(new URL("/unsubscribed?error=invalid", req.nextUrl.origin));
  }

  const db = supabaseAdmin();
  const subscriber = await findSubscriberByUnsubToken(db, hashToken(token));

  if (!subscriber) {
    return NextResponse.redirect(new URL("/unsubscribed?error=invalid", req.nextUrl.origin));
  }

  if (subscriber.status === "unsubscribed") {
    return NextResponse.redirect(new URL("/unsubscribed?already=1", req.nextUrl.origin));
  }

  try {
    await updateSubscriber(db, subscriber.id, {
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.redirect(new URL("/unsubscribed?error=server", req.nextUrl.origin));
  }

  return NextResponse.redirect(new URL("/unsubscribed?success=1", req.nextUrl.origin));
}
