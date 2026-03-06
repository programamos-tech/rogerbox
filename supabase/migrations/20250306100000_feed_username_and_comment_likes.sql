-- Username en perfiles (único, para @handle en el feed)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- Mostrar username en posts (rellenado al publicar desde perfil)
ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS author_username TEXT;

-- Likes en comentarios
CREATE TABLE IF NOT EXISTS feed_comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES feed_post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_comment_likes_comment_id ON feed_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_feed_comment_likes_user_id ON feed_comment_likes(user_id);

ALTER TABLE feed_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_comment_likes_select" ON feed_comment_likes;
DROP POLICY IF EXISTS "feed_comment_likes_insert" ON feed_comment_likes;
DROP POLICY IF EXISTS "feed_comment_likes_delete" ON feed_comment_likes;
CREATE POLICY "feed_comment_likes_select"
  ON feed_comment_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "feed_comment_likes_insert"
  ON feed_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_comment_likes_delete"
  ON feed_comment_likes FOR DELETE
  USING (auth.uid() = user_id);
