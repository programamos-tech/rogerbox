-- Permitir que el trigger del bot inserte posts con author_id NULL
DROP POLICY IF EXISTS "feed_posts_insert_bot" ON public.feed_posts;
CREATE POLICY "feed_posts_insert_bot"
  ON public.feed_posts FOR INSERT
  WITH CHECK (author_id IS NULL);

-- Notificaciones por usuario (campanita): feed, menciones, etc.
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  post_id UUID REFERENCES public.feed_posts(id) ON DELETE SET NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON public.user_notifications(user_id, read_at) WHERE read_at IS NULL;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_notifications_select_own" ON public.user_notifications;
CREATE POLICY "user_notifications_select_own"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Solo el sistema (trigger/service) inserta; los usuarios no insertan sus propias notificaciones.
-- Permitimos que el usuario marque como leída (update read_at).
DROP POLICY IF EXISTS "user_notifications_update_own" ON public.user_notifications;
CREATE POLICY "user_notifications_update_own"
  ON public.user_notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT: el trigger inserta para el nuevo usuario; en signup auth.uid() = NEW.id.
DROP POLICY IF EXISTS "user_notifications_insert_own_or_system" ON public.user_notifications;
CREATE POLICY "user_notifications_insert_own_or_system"
  ON public.user_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Actualizar el trigger de bienvenida: etiquetar con @username y crear notificación
CREATE OR REPLACE FUNCTION public.create_welcome_post_for_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_post_id UUID;
  welcome_content TEXT;
  display_name TEXT;
BEGIN
  display_name := COALESCE(NULLIF(TRIM(NEW.name), ''), 'nuevo miembro');
  IF NEW.username IS NOT NULL AND TRIM(NEW.username) <> '' THEN
    welcome_content := '¡Bienvenido/a @' || TRIM(NEW.username) || ' a la casa de la alta intensidad! 🎉 ¡Que empiece el reto!';
  ELSE
    welcome_content := '¡Bienvenido/a @' || display_name || ' a la casa de la alta intensidad! 🎉 ¡Que empiece el reto!';
  END IF;

  INSERT INTO public.feed_posts (
    author_id,
    author_name,
    author_username,
    content,
    image_urls,
    is_published
  ) VALUES (
    NULL,
    'ROGERBOT',
    NULL,
    welcome_content,
    '{}',
    true
  )
  RETURNING id INTO new_post_id;

  INSERT INTO public.user_notifications (user_id, type, title, message, link, post_id)
  VALUES (
    NEW.id,
    'feed_welcome',
    '¡Bienvenido/a!',
    'ROGERBOT te dio la bienvenida en el feed. ¡Que empiece el reto!',
    '/feed#post-' || new_post_id,
    new_post_id
  );

  RETURN NEW;
END;
$$;
