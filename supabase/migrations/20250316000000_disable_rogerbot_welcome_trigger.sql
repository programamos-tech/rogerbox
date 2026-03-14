-- Desactivar ROGERBOT: el trigger de bienvenida llenaba el feed de spam (un post por cada nuevo usuario).
-- No se elimina la función create_welcome_post_for_new_profile(); solo se quita el trigger.
-- Para reactivar: crear una migración que ejecute:
--   CREATE TRIGGER trigger_welcome_post_on_new_profile
--     AFTER INSERT ON public.profiles FOR EACH ROW
--     EXECUTE FUNCTION public.create_welcome_post_for_new_profile();

DROP TRIGGER IF EXISTS trigger_welcome_post_on_new_profile ON public.profiles;
