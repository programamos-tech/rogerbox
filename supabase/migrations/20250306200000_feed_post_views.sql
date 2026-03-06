-- Vistas del post (cuántas veces se ha visto)
ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;
