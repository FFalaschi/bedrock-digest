CREATE TABLE IF NOT EXISTS feed_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  url           text        NOT NULL,
  canonical_url text        NOT NULL,
  source_slug   text        NOT NULL,
  source_name   text        NOT NULL,
  published_at  timestamptz,
  excerpt       text,
  fetched_at    timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feed_items_canonical_url_unique UNIQUE (canonical_url)
);

CREATE INDEX IF NOT EXISTS feed_items_source_slug_idx  ON feed_items (source_slug);
CREATE INDEX IF NOT EXISTS feed_items_published_at_idx ON feed_items (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS feed_items_fetched_at_idx   ON feed_items (fetched_at DESC);
CREATE INDEX IF NOT EXISTS feed_items_created_at_idx   ON feed_items (created_at DESC);
