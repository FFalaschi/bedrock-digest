import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServiceClient } from '@/lib/supabase';
import type { ScoreBreakdown, RankedItem, TokenUsage, RankResult } from './types';

const MODEL = 'claude-haiku-4-5-20251001';
const DEFAULT_SHORTLIST = 10;
const MAX_CANDIDATES = 200;
const MAX_EXCERPT_RANKING_CHARS = 300; // trimmed for the ranking batch
const MAX_EXCERPT_SUMMARY_CHARS = 600; // fuller context for summarization

// claude-haiku-4-5 pricing ($/M tokens)
const PRICE_INPUT_PER_M = 0.8;
const PRICE_OUTPUT_PER_M = 4.0;

// Hard cost cap per run — bail before summarization if ranking already exceeds this.
const MAX_RUN_COST_USD = 0.5;

interface Candidate {
  id: string;
  title: string;
  url: string;
  source_name: string;
  published_at: string | null;
  excerpt: string | null;
}

function estimateCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICE_INPUT_PER_M +
    (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M
  );
}

/** Extract a JSON array from an LLM response that might wrap it in a code fence. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  // Fallback: find first '[' and last ']'
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

async function rankCandidates(
  client: Anthropic,
  candidates: Candidate[],
): Promise<{ scores: Map<string, { total: number; breakdown: ScoreBreakdown }>; usage: Pick<TokenUsage, 'ranking_input' | 'ranking_output'> }> {
  const batch = candidates.map(c => ({
    id: c.id,
    title: c.title,
    excerpt: (c.excerpt ?? '').slice(0, MAX_EXCERPT_RANKING_CHARS),
  }));

  const system = `You are an expert editor for Bedrock Digest — a weekly newsletter for product designers who work in the AI space.

Score each article on three dimensions (each 0–10):

- relevance: How directly relevant to AI × Product Design?
  10 = core topic (AI tools for design, designing AI products, AI/UX research, LLM interfaces)
  5  = tangentially related (general design trends, generic AI news without design angle)
  0  = unrelated (pure tech, marketing fluff, unrelated industry)

- novelty: Is this a fresh insight vs. well-known advice?
  10 = genuinely new perspective, technique, data, or product launch
  5  = useful but familiar territory
  0  = evergreen basics or repeated news

- signal: Is this high-signal, specific, and low-noise?
  10 = concrete, actionable, or richly informative
  5  = moderate detail with some useful content
  0  = clickbait, vague, or buzzword-heavy

Return ONLY a valid JSON array, no text before or after:
[{"id":"<uuid>","relevance":<0-10>,"novelty":<0-10>,"signal":<0-10>,"reasoning":"<one sentence>"},...]`;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system,
    messages: [
      {
        role: 'user',
        content: `Score these ${batch.length} articles:\n\n${JSON.stringify(batch)}`,
      },
    ],
  }).catch((err: unknown) => {
    const e = err as { status?: number; message?: string };
    if (e?.status === 429 || e?.status === 529) throw new Error('QUOTA_EXCEEDED: rate limit hit');
    if (e?.status === 402) throw new Error('QUOTA_EXCEEDED: credit limit reached');
    throw err;
  });

  const block = msg.content[0];
  const text = block?.type === 'text' ? block.text : '';
  let raw: Array<{ id: string; relevance: number; novelty: number; signal: number; reasoning: string }>;
  try {
    raw = JSON.parse(extractJson(text));
  } catch {
    throw new Error(`Ranking LLM returned unparseable JSON. Preview: ${text.slice(0, 200)}`);
  }

  const scores = new Map<string, { total: number; breakdown: ScoreBreakdown }>();
  for (const s of raw) {
    if (!s.id) continue;
    const rel = Math.max(0, Math.min(10, s.relevance ?? 0));
    const nov = Math.max(0, Math.min(10, s.novelty ?? 0));
    const sig = Math.max(0, Math.min(10, s.signal ?? 0));
    scores.set(s.id, {
      total: rel + nov + sig,
      breakdown: { relevance: rel, novelty: nov, signal: sig, reasoning: s.reasoning ?? '' },
    });
  }

  return {
    scores,
    usage: {
      ranking_input: msg.usage.input_tokens,
      ranking_output: msg.usage.output_tokens,
    },
  };
}

async function summarizeItems(
  client: Anthropic,
  items: (Candidate & { score_total: number; score_breakdown: ScoreBreakdown })[],
): Promise<{ summaries: Map<string, { summary: string; why_matters: string }>; usage: Pick<TokenUsage, 'summary_input' | 'summary_output'> }> {
  const batch = items.map(i => ({
    id: i.id,
    title: i.title,
    source: i.source_name,
    excerpt: (i.excerpt ?? '').slice(0, MAX_EXCERPT_SUMMARY_CHARS),
  }));

  const system = `You are the writer for Bedrock Digest — a weekly newsletter for product designers in the AI space. Voice: clear, direct, insightful, zero fluff. Audience: mid-to-senior product designers who are busy and smart.

For each article produce:
- summary: 2–3 sentences. No "this article..." opener — start with the insight directly.
- why_matters: One punchy sentence under 25 words. Start with a verb or strong noun. Make it feel urgent.

Return ONLY valid JSON array, no text before or after:
[{"id":"<uuid>","summary":"...","why_matters":"..."},...]`;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system,
    messages: [
      {
        role: 'user',
        content: `Summarize these ${batch.length} articles:\n\n${JSON.stringify(batch)}`,
      },
    ],
  }).catch((err: unknown) => {
    const e = err as { status?: number; message?: string };
    if (e?.status === 429 || e?.status === 529) throw new Error('QUOTA_EXCEEDED: rate limit hit');
    if (e?.status === 402) throw new Error('QUOTA_EXCEEDED: credit limit reached');
    throw err;
  });

  const block = msg.content[0];
  const text = block?.type === 'text' ? block.text : '';
  let raw: Array<{ id: string; summary: string; why_matters: string }>;
  try {
    raw = JSON.parse(extractJson(text));
  } catch {
    throw new Error(`Summarization LLM returned unparseable JSON. Preview: ${text.slice(0, 200)}`);
  }

  const summaries = new Map<string, { summary: string; why_matters: string }>();
  for (const s of raw) {
    if (!s.id) continue;
    summaries.set(s.id, { summary: s.summary ?? '', why_matters: s.why_matters ?? '' });
  }

  return {
    summaries,
    usage: {
      summary_input: msg.usage.input_tokens,
      summary_output: msg.usage.output_tokens,
    },
  };
}

export async function runRankingPipeline(opts: {
  windowDays?: number;
  shortlistSize?: number;
  dryRun?: boolean;
}): Promise<RankResult> {
  const { windowDays = 7, shortlistSize = DEFAULT_SHORTLIST, dryRun = false } = opts;

  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const supabase = getSupabaseServiceClient();

  const { data: candidates, error: fetchError } = await supabase
    .from('feed_items')
    .select('id, title, url, source_name, published_at, excerpt')
    .gte('fetched_at', windowStart.toISOString())
    .order('published_at', { ascending: false })
    .limit(MAX_CANDIDATES);

  if (fetchError) throw new Error(`DB fetch failed: ${fetchError.message}`);

  const zeroUsage: TokenUsage = {
    ranking_input: 0,
    ranking_output: 0,
    summary_input: 0,
    summary_output: 0,
    total: 0,
    cost_usd_estimate: 0,
  };

  if (!candidates || candidates.length === 0) {
    return {
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      candidates_evaluated: 0,
      shortlist: [],
      token_usage: zeroUsage,
      dry_run: dryRun,
      stored_count: 0,
    };
  }

  const client = new Anthropic();

  // Phase 1: rank all candidates in one batch call
  const { scores, usage: rankUsage } = await rankCandidates(client, candidates as Candidate[]);

  const rankCost = estimateCost(rankUsage.ranking_input, rankUsage.ranking_output);
  console.log(`[rank] phase-1 done: ${candidates.length} candidates, ${rankUsage.ranking_input}+${rankUsage.ranking_output} tokens, $${rankCost.toFixed(4)}`);

  if (rankCost >= MAX_RUN_COST_USD) {
    throw new Error(`COST_CAP: ranking cost $${rankCost.toFixed(4)} exceeded cap of $${MAX_RUN_COST_USD}`);
  }

  // Select top N by total score (items with no score from LLM get score 0)
  type ScoredCandidate = Candidate & { score_total: number; score_breakdown: ScoreBreakdown };
  const scored: ScoredCandidate[] = (candidates as Candidate[]).map(c => {
    const s = scores.get(c.id);
    return {
      ...c,
      score_total: s?.total ?? 0,
      score_breakdown: s?.breakdown ?? { relevance: 0, novelty: 0, signal: 0, reasoning: '' },
    };
  });

  const topCandidates = scored
    .sort((a, b) => b.score_total - a.score_total)
    .slice(0, shortlistSize);

  // Phase 2: summarize the shortlist
  const { summaries, usage: sumUsage } = await summarizeItems(client, topCandidates);

  const totalInput = rankUsage.ranking_input + sumUsage.summary_input;
  const totalOutput = rankUsage.ranking_output + sumUsage.summary_output;
  const totalCost = estimateCost(totalInput, totalOutput);

  console.log(`[rank] phase-2 done: ${topCandidates.length} summaries, ${sumUsage.summary_input}+${sumUsage.summary_output} tokens, $${totalCost.toFixed(4)} total`);

  const tokenUsage: TokenUsage = {
    ranking_input: rankUsage.ranking_input,
    ranking_output: rankUsage.ranking_output,
    summary_input: sumUsage.summary_input,
    summary_output: sumUsage.summary_output,
    total: totalInput + totalOutput,
    cost_usd_estimate: totalCost,
  };

  // Build the shortlist
  const shortlist: RankedItem[] = topCandidates.map(item => {
    const sum = summaries.get(item.id) ?? { summary: '', why_matters: '' };
    return {
      id: item.id,
      title: item.title,
      url: item.url,
      source_name: item.source_name,
      published_at: item.published_at,
      score_total: item.score_total,
      score_breakdown: item.score_breakdown,
      summary: sum.summary,
      why_matters: sum.why_matters,
    };
  });

  // Persist results unless dry-run
  let storedCount = 0;
  if (!dryRun) {
    const now = new Date().toISOString();
    for (const item of shortlist) {
      const { error } = await supabase
        .from('feed_items')
        .update({
          ai_score: item.score_total,
          ai_score_breakdown: item.score_breakdown,
          ai_summary: item.summary,
          ai_why_matters: item.why_matters,
          ai_ranked_at: now,
        })
        .eq('id', item.id);

      if (error) {
        console.error(`[rank] failed to persist item ${item.id}: ${error.message}`);
      } else {
        storedCount++;
      }
    }
    console.log(`[rank] stored ${storedCount}/${shortlist.length} items`);
  }

  return {
    window_start: windowStart.toISOString(),
    window_end: windowEnd.toISOString(),
    candidates_evaluated: candidates.length,
    shortlist,
    token_usage: tokenUsage,
    dry_run: dryRun,
    stored_count: storedCount,
  };
}
