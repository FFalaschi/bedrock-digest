import { type NextRequest, NextResponse } from 'next/server';
import { runRankingPipeline } from '@/lib/ai/ranker';

// Allow up to 120s — ranking + summarization needs more time than ingest.
export const maxDuration = 120;

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env['CRON_SECRET'];
  if (!cronSecret) return true; // local dev without secret
  return req.headers.get('authorization') === `Bearer ${cronSecret}`;
}

/**
 * GET /api/rank           — dry-run by default; nothing written to DB.
 * GET /api/rank?commit=true — write mode (used by Vercel weekly cron).
 * POST /api/rank          — write mode for explicit manual triggers.
 *
 * Query params (both methods):
 *   window=7              — look-back window in days (default 7)
 *   limit=10              — shortlist size (default 10)
 *   commit=true           — persist results (GET only; POST always persists)
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const windowDays = Math.max(1, parseInt(searchParams.get('window') ?? '7', 10));
  const limit = Math.max(1, Math.min(20, parseInt(searchParams.get('limit') ?? '10', 10)));
  const dryRun = searchParams.get('commit') !== 'true';

  try {
    const result = await runRankingPipeline({ windowDays, shortlistSize: limit, dryRun });
    console.log(`[rank] GET complete (${dryRun ? 'dry-run' : 'write'})`, {
      candidates: result.candidates_evaluated,
      shortlist: result.shortlist.length,
      cost: result.token_usage.cost_usd_estimate,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith('QUOTA_EXCEEDED') || message.startsWith('COST_CAP') ? 429 : 500;
    console.error('[rank] GET error:', message);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const windowDays = Math.max(1, parseInt(searchParams.get('window') ?? '7', 10));
  const limit = Math.max(1, Math.min(20, parseInt(searchParams.get('limit') ?? '10', 10)));

  try {
    const result = await runRankingPipeline({ windowDays, shortlistSize: limit, dryRun: false });
    console.log('[rank] write-mode complete', {
      candidates: result.candidates_evaluated,
      stored: result.stored_count,
      cost: result.token_usage.cost_usd_estimate,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith('QUOTA_EXCEEDED') || message.startsWith('COST_CAP') ? 429 : 500;
    console.error('[rank] write-mode error:', message);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
