import type { AdapterResult, FeedItem } from '../types';
import { canonicalizeUrl } from '../url';

const HN_API = 'https://hacker-news.firebaseio.com/v0';
const TOP_STORIES_LIMIT = 100;
const STORY_FETCH_TIMEOUT_MS = 8_000;
const BATCH_SIZE = 10;

const KEYWORDS = [
  'design', 'ux', 'ui ', 'figma', 'interface', 'typography', 'accessibility',
  'a11y', 'product design', 'visual design', 'design system',
  'ai', 'llm', 'gpt', 'claude', 'anthropic', 'openai', 'gemini',
  'machine learning', 'artificial intelligence', 'neural', 'agent',
  'chatgpt', 'copilot', 'diffusion', 'multimodal',
];

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return KEYWORDS.some(kw => lower.includes(kw));
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), STORY_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

interface HnStory {
  id: number;
  type?: string;
  title?: string;
  url?: string;
  time?: number;
}

async function fetchStory(id: number, fetchedAt: string): Promise<FeedItem | null> {
  try {
    const story = await fetchJson<HnStory>(`${HN_API}/item/${id}.json`);
    if (story.type !== 'story' || !story.url || !story.title) return null;
    if (!isRelevant(story.title)) return null;
    return {
      title: story.title,
      url: story.url,
      canonical_url: canonicalizeUrl(story.url),
      source_slug: 'hacker-news',
      source_name: 'Hacker News',
      published_at: story.time ? new Date(story.time * 1000).toISOString() : null,
      excerpt: null,
      fetched_at: fetchedAt,
    };
  } catch {
    return null;
  }
}

export async function fetchHackerNews(): Promise<AdapterResult> {
  const fetchedAt = new Date().toISOString();
  const items: FeedItem[] = [];
  const errors: string[] = [];

  try {
    const ids = await fetchJson<number[]>(`${HN_API}/topstories.json`);
    const top = ids.slice(0, TOP_STORIES_LIMIT);

    for (let i = 0; i < top.length; i += BATCH_SIZE) {
      const batch = top.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(id => fetchStory(id, fetchedAt)),
      );
      for (const item of results) {
        if (item) items.push(item);
      }
    }
  } catch (err) {
    errors.push(
      `hacker-news: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return { items, errors };
}
