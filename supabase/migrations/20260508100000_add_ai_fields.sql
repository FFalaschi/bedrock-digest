-- Add AI ranking and summarization fields to feed_items.
-- These are nullable so existing rows are unaffected.
-- ai_score_breakdown stores the per-dimension rubric scores (relevance, novelty, signal).
ALTER TABLE feed_items
  ADD COLUMN IF NOT EXISTS ai_score          real,
  ADD COLUMN IF NOT EXISTS ai_score_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS ai_summary        text,
  ADD COLUMN IF NOT EXISTS ai_why_matters    text,
  ADD COLUMN IF NOT EXISTS ai_ranked_at      timestamptz;

-- Index for picking the top-ranked items quickly when building the digest.
CREATE INDEX IF NOT EXISTS feed_items_ai_score_idx
  ON feed_items (ai_score DESC NULLS LAST);
