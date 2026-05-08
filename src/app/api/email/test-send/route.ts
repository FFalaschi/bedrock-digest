import { NextRequest, NextResponse } from "next/server";
import { sendDigest } from "@/lib/email/sender";
import type { DigestPayload } from "@/lib/email/types";

const SEND_SECRET = process.env.DIGEST_SEND_SECRET;

// Sample payload that exercises all template sections
const SAMPLE_PAYLOAD: DigestPayload = {
  weekEnding: new Date().toISOString().slice(0, 10),
  issueNumber: 1,
  items: [
    {
      title: "How AI is reshaping the Product Designer's toolkit in 2026",
      url: "https://example.com/ai-design-toolkit",
      source: "UX Collective",
      summary:
        "A deep dive into how generative AI tools are augmenting — not replacing — the core skills of product designers. From rapid prototyping to accessibility audits, the workflows that teams are adopting today.",
      score: 9,
    },
    {
      title: "Figma's AI-first feature rollout: what actually shipped",
      url: "https://example.com/figma-ai-features",
      source: "Design Tools Weekly",
      summary:
        "An honest breakdown of Figma's AI features six months after launch: which ones stuck, which ones designers quietly stopped using, and what the adoption data says about where AI fits in the design process.",
      score: 8,
    },
    {
      title: "The mental model shift from UI design to prompt design",
      url: "https://example.com/ui-to-prompt-design",
      source: "Bootcamp",
      summary:
        "Designers who thrive with AI tools share a common trait: they've developed strong instincts for writing prompts as constraints, not instructions. This piece explores how to build that muscle deliberately.",
      score: 7,
    },
  ],
};

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization") ?? "";
  if (!SEND_SECRET || auth !== `Bearer ${SEND_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let to: string;
  try {
    const body = await request.json();
    to = body.to ?? process.env.CEO_EMAIL ?? "franco@falaschi.com";
  } catch {
    to = process.env.CEO_EMAIL ?? "franco@falaschi.com";
  }

  try {
    const result = await sendDigest({
      to,
      payload: SAMPLE_PAYLOAD,
      unsubscribeToken: "test-token-preview",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
