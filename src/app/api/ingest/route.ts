import { type NextRequest, NextResponse } from 'next/server';
import { runIngest } from '@/lib/pipeline/ingest';

// Allow up to 60 s on Vercel hobby; increase to 300 on Pro if needed.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cronSecret = process.env['CRON_SECRET'];
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await runIngest();
    console.log('[ingest] complete', result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ingest] fatal:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
