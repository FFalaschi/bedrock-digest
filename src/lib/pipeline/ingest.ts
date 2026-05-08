import { getSupabaseServiceClient } from '@/lib/supabase';
import type { FeedItem } from './types';
import { RSS_SOURCES } from './sources';
import { fetchRssFeed } from './adapters/rss';
import { fetchHackerNews } from './adapters/hackernews';
import { fetchLobsters } from './adapters/lobsters';

export interface IngestResult {
  fetched: number;
  inserted: number;
  skipped: number;
  errors: string[];
  durationMs: number;
}

async function persistItems(
  items: FeedItem[],
): Promise<{ inserted: number; skipped: number }> {
  if (items.length === 0) return { inserted: 0, skipped: 0 };

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('feed_items')
    .upsert(items, { onConflict: 'canonical_url', ignoreDuplicates: true })
    .select('id');

  if (error) throw new Error(`DB upsert failed: ${error.message}`);

  const inserted = data?.length ?? 0;
  return { inserted, skipped: items.length - inserted };
}

function deduplicateBatch(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.canonical_url)) return false;
    seen.add(item.canonical_url);
    return true;
  });
}

export async function runIngest(): Promise<IngestResult> {
  const start = Date.now();
  const allItems: FeedItem[] = [];
  const allErrors: string[] = [];

  // Run all RSS feeds concurrently
  const rssResults = await Promise.all(RSS_SOURCES.map(fetchRssFeed));
  for (const r of rssResults) {
    allItems.push(...r.items);
    allErrors.push(...r.errors);
  }

  // Run API sources concurrently
  const [hnResult, lobstersResult] = await Promise.all([
    fetchHackerNews(),
    fetchLobsters(),
  ]);
  allItems.push(...hnResult.items, ...lobstersResult.items);
  allErrors.push(...hnResult.errors, ...lobstersResult.errors);

  const dedupedItems = deduplicateBatch(allItems);
  const withinBatchDupes = allItems.length - dedupedItems.length;

  const { inserted, skipped: dbSkipped } = await persistItems(dedupedItems);

  return {
    fetched: allItems.length,
    inserted,
    skipped: withinBatchDupes + dbSkipped,
    errors: allErrors,
    durationMs: Date.now() - start,
  };
}
