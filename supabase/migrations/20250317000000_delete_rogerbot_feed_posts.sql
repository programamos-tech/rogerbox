-- Eliminar del feed todos los posts del ROGERBOT (bienvenidas automáticas que generaban spam).
-- Solo se borran posts con author_id NULL y author_name del bot; el resto no se toca.

DELETE FROM public.feed_posts
WHERE author_id IS NULL
  AND (author_name = 'ROGERBOT' OR author_name = 'RogerBox Bot');
