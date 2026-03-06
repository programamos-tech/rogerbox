-- Feed comunitario: posts del equipo y de usuarios, likes y comentarios
-- Los usuarios pueden crear posts, dar like y comentar.

CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'RogerBox',
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_is_published ON feed_posts(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_feed_posts_author_id ON feed_posts(author_id);

CREATE TABLE IF NOT EXISTS feed_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_post_likes_post_id ON feed_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_post_likes_user_id ON feed_post_likes(user_id);

CREATE TABLE IF NOT EXISTS feed_post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_post_comments_post_id ON feed_post_comments(post_id);

-- RLS
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_comments ENABLE ROW LEVEL SECURITY;

-- Posts: eliminar políticas si existen (migración idempotente)
DROP POLICY IF EXISTS "feed_posts_select_published" ON feed_posts;
DROP POLICY IF EXISTS "feed_posts_insert_own" ON feed_posts;
DROP POLICY IF EXISTS "feed_posts_update_own" ON feed_posts;
DROP POLICY IF EXISTS "feed_posts_delete_own" ON feed_posts;
-- Posts: todos pueden leer los publicados
CREATE POLICY "feed_posts_select_published"
  ON feed_posts FOR SELECT
  USING (is_published = true);
CREATE POLICY "feed_posts_insert_own"
  ON feed_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "feed_posts_update_own"
  ON feed_posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "feed_posts_delete_own"
  ON feed_posts FOR DELETE
  USING (auth.uid() = author_id);

-- Likes: eliminar y recrear
DROP POLICY IF EXISTS "feed_post_likes_select" ON feed_post_likes;
DROP POLICY IF EXISTS "feed_post_likes_insert" ON feed_post_likes;
DROP POLICY IF EXISTS "feed_post_likes_delete" ON feed_post_likes;
CREATE POLICY "feed_post_likes_select"
  ON feed_post_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "feed_post_likes_insert"
  ON feed_post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_post_likes_delete"
  ON feed_post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios: eliminar y recrear
DROP POLICY IF EXISTS "feed_post_comments_select" ON feed_post_comments;
DROP POLICY IF EXISTS "feed_post_comments_insert" ON feed_post_comments;
DROP POLICY IF EXISTS "feed_post_comments_delete" ON feed_post_comments;
CREATE POLICY "feed_post_comments_select"
  ON feed_post_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "feed_post_comments_insert"
  ON feed_post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_post_comments_delete"
  ON feed_post_comments FOR DELETE
  USING (auth.uid() = user_id);
