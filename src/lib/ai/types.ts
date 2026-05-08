export interface ScoreBreakdown {
  relevance: number; // 0-10: directly about AI × Product Design
  novelty: number;   // 0-10: new insight, not a rehash
  signal: number;    // 0-10: specific/actionable, low noise
  reasoning: string; // one-sentence explanation from the LLM
}

export interface RankedItem {
  id: string;
  title: string;
  url: string;
  source_name: string;
  published_at: string | null;
  score_total: number; // 0–30
  score_breakdown: ScoreBreakdown;
  summary: string;      // 2–3 sentences
  why_matters: string;  // one punchy line
}

export interface TokenUsage {
  ranking_input: number;
  ranking_output: number;
  summary_input: number;
  summary_output: number;
  total: number;
  cost_usd_estimate: number;
}

export interface RankResult {
  window_start: string;
  window_end: string;
  candidates_evaluated: number;
  shortlist: RankedItem[];
  token_usage: TokenUsage;
  dry_run: boolean;
  stored_count: number;
}
