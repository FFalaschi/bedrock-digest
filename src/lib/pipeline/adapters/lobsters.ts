import type { AdapterResult, FeedItem } from '../types';
import { canonicalizeUrl } from '../url';

// Lobste.rs JSON API — design and programming tags are good signal for our digest.
const TAGS = ['design', 'ai'];
const FETCH_TIMEOUT_MS = 10_000;

interface LobstersStory {
  title?: string;
  url?: string;
  created_at?: string;
  description?: string;
  tags?: string[];
}

async function fetchTag(tag: string, fetchedAt: string): Promise<FeedItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`https://lobste.rs/t/${tag}.json`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'BedrockDigest/1.0 (+https://bedrock-digest.vercel.app)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const stories = (await res.json()) as LobstersStory[];
    return stories
      .filter(s => s.url && s.title)
      .map(s => ({
        title: s.title!,
        url: s.url!,
        canonical_url: canonicalizeUrl(s.url!),
        source_slug: 'lobsters',
        source_name: 'Lobste.rs',
        published_at: s.created_at ? new Date(s.created_at).toISOString() : null,
        excerpt: s.description ? s.description.slice(0, 500) : null,
        fetched_at: fetchedAt,
      }));
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLobsters(): Promise<AdapterResult> {
  const fetchedAt = new Date().toISOString();
  const items: FeedItem[] = [];
  const errors: string[] = [];

  for (const tag of TAGS) {
    try {
      const tagItems = await fetchTag(tag, fetchedAt);
      items.push(...tagItems);
    } catch (err) {
      errors.push(
        `lobsters/${tag}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { items, errors };
}
