export interface DigestItem {
  title: string;
  url: string;
  source: string;
  summary: string;
  /** 1–10 relevance score from curation step */
  score?: number;
}

export interface DigestPayload {
  /** ISO date string for the week ending date, e.g. "2026-05-09" */
  weekEnding: string;
  /** Issue number, starting at 1 */
  issueNumber: number;
  items: DigestItem[];
}

export interface SendDigestOptions {
  to: string | string[];
  payload: DigestPayload;
  /** Token used to build the unsubscribe link */
  unsubscribeToken: string;
}

export interface SendResult {
  id: string;
  to: string | string[];
}
