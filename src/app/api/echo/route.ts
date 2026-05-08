import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get("message") ?? "hello";
  return NextResponse.json({ echo: message, ts: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => ({}));
  return NextResponse.json({ echo: body, ts: new Date().toISOString() });
}
