import { NextRequest, NextResponse } from "next/server";
import { hashToken } from "@/lib/crypto";
import {
  supabaseAdmin,
  findSubscriberByConfirmToken,
  updateSubscriber,
} from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return NextResponse.redirect(new URL("/confirm?error=invalid", req.nextUrl.origin));
  }

  const db = supabaseAdmin();
  const subscriber = await findSubscriberByConfirmToken(db, hashToken(token));

  if (!subscriber) {
    return NextResponse.redirect(new URL("/confirm?error=invalid", req.nextUrl.origin));
  }

  if (subscriber.status === "active") {
    return NextResponse.redirect(new URL("/confirm?already=1", req.nextUrl.origin));
  }

  try {
    await updateSubscriber(db, subscriber.id, {
      status: "active",
      confirmed_at: new Date().toISOString(),
      confirm_token_hash: null,
    });
  } catch {
    return NextResponse.redirect(new URL("/confirm?error=server", req.nextUrl.origin));
  }

  return NextResponse.redirect(new URL("/confirm?success=1", req.nextUrl.origin));
}
