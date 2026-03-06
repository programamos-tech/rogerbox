-- Bot RogerBox: anuncia y presenta a los nuevos miembros en el feed (estilo Discord)
-- Cualquier INSERT en profiles crea un post del BOT dando la bienvenida y presentando al nuevo miembro.

CREATE OR REPLACE FUNCTION public.create_welcome_post_for_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.feed_posts (
    author_id,
    author_name,
    content,
    image_urls,
    is_published
  ) VALUES (
    NULL,
    'ROGERBOT',
    '¡Bienvenido/a ' || COALESCE(NULLIF(TRIM(NEW.name), ''), 'nuevo miembro') || ' a la casa de la alta intensidad! 🎉 ¡Que empiece el reto!',
    '{}',
    true
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_welcome_post_on_new_profile ON public.profiles;
CREATE TRIGGER trigger_welcome_post_on_new_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_welcome_post_for_new_profile();
