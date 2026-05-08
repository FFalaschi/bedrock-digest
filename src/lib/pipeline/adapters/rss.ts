import Parser from 'rss-parser';
import type { AdapterResult, FeedItem } from '../types';
import type { RssSource } from '../sources';
import { canonicalizeUrl } from '../url';

const parser = new Parser({
  timeout: 10_000,
  headers: {
    'User-Agent': 'BedrockDigest/1.0 (+https://bedrock-digest.vercel.app)',
  },
});

function stripHtml(text: string | undefined): string {
  return (text ?? '').replace(/<[^>]+>/g, '').trim();
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function toExcerpt(entry: Parser.Item): string | null {
  const raw = entry.contentSnippet ?? entry.summary ?? entry.content;
  if (!raw) return null;
  const cleaned = truncate(stripHtml(raw), 500);
  return cleaned || null;
}

export async function fetchRssFeed(source: RssSource): Promise<AdapterResult> {
  const fetchedAt = new Date().toISOString();
  const items: FeedItem[] = [];
  const errors: string[] = [];

  try {
    const feed = await parser.parseURL(source.url);
    for (const entry of feed.items ?? []) {
      const rawUrl = entry.link ?? entry.guid ?? '';
      if (!rawUrl) continue;
      items.push({
        title: (entry.title ?? '').trim() || 'Untitled',
        url: rawUrl,
        canonical_url: canonicalizeUrl(rawUrl),
        source_slug: source.slug,
        source_name: source.name,
        published_at:
          entry.pubDate ? new Date(entry.pubDate).toISOString()
          : entry.isoDate ?? null,
        excerpt: toExcerpt(entry),
        fetched_at: fetchedAt,
      });
    }
  } catch (err) {
    errors.push(
      `${source.slug}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return { items, errors };
}
