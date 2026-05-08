export interface FeedItem {
  title: string;
  url: string;
  canonical_url: string;
  source_slug: string;
  source_name: string;
  published_at: string | null;
  excerpt: string | null;
  fetched_at: string;
}

export interface AdapterResult {
  items: FeedItem[];
  errors: string[];
}
