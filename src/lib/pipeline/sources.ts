// Starter source set — Product Design + AI focus.
// CEO to review and extend via BDV-3 thread.

export interface RssSource {
  slug: string;
  name: string;
  url: string;
}

export interface ApiSource {
  slug: string;
  name: string;
  kind: 'hackernews' | 'lobsters';
}

export const RSS_SOURCES: RssSource[] = [
  {
    slug: 'ux-collective',
    name: 'UX Collective',
    url: 'https://uxdesign.cc/feed',
  },
  {
    slug: 'smashing-magazine',
    name: 'Smashing Magazine',
    url: 'https://www.smashingmagazine.com/feed/',
  },
  {
    slug: 'verge-design',
    name: 'The Verge / Design',
    url: 'https://www.theverge.com/rss/design/index.xml',
  },
  {
    slug: 'nngroup',
    name: 'Nielsen Norman Group',
    url: 'https://www.nngroup.com/feed/rss/',
  },
  {
    slug: 'figma-blog',
    name: 'Figma Blog',
    url: 'https://www.figma.com/blog/rss.xml',
  },
  {
    slug: 'wired-design',
    name: 'WIRED Design',
    url: 'https://www.wired.com/feed/category/design/latest/rss',
  },
  {
    slug: 'fast-company-design',
    name: 'Fast Company Design',
    url: 'https://www.fastcompany.com/section/design/rss',
  },
];

export const API_SOURCES: ApiSource[] = [
  { slug: 'hacker-news', name: 'Hacker News', kind: 'hackernews' },
  { slug: 'lobsters', name: 'Lobste.rs', kind: 'lobsters' },
];
