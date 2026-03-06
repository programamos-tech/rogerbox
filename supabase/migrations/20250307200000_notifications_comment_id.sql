-- Enlace directo al comentario desde la notificación
ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES public.feed_post_comments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_notifications_comment_id ON public.user_notifications(comment_id) WHERE comment_id IS NOT NULL;
