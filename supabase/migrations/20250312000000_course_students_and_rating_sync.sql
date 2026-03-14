-- Rogerbox: mantener students_count y rating de cursos en sync con compras y valoraciones
-- Requiere: courses, course_purchases, course_lessons, lesson_ratings

-- ========== 1. Incrementar estudiantes al comprar (llamado desde webhook) ==========
CREATE OR REPLACE FUNCTION increment_course_students(p_course_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE courses
  SET students_count = COALESCE(students_count, 0) + 1,
      updated_at = NOW()
  WHERE id = p_course_id;
END;
$$;

-- ========== 1b. Recalcular students_count desde course_purchases (para trigger) ==========
CREATE OR REPLACE FUNCTION update_course_students_count(p_course_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE courses
  SET students_count = COALESCE(
    (SELECT COUNT(*)::integer FROM course_purchases WHERE course_id = p_course_id AND is_active = true),
    0
  ),
  updated_at = NOW()
  WHERE id = p_course_id;
END;
$$;

-- Trigger: al insertar/actualizar/borrar en course_purchases, actualizar students_count del curso
CREATE OR REPLACE FUNCTION trigger_update_course_students_on_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id UUID;
BEGIN
  v_course_id := COALESCE(NEW.course_id, OLD.course_id);
  IF v_course_id IS NOT NULL THEN
    PERFORM update_course_students_count(v_course_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_course_purchase_update_students_count ON course_purchases;
CREATE TRIGGER trg_course_purchase_update_students_count
  AFTER INSERT OR UPDATE OF is_active, course_id OR DELETE ON course_purchases
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_course_students_on_purchase();

-- ========== 2. Recalcular rating del curso desde lesson_ratings ==========
CREATE OR REPLACE FUNCTION update_course_rating_from_lessons(p_course_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC(3, 2);
BEGIN
  SELECT ROUND(AVG(lr.rating)::numeric, 2) INTO avg_rating
  FROM lesson_ratings lr
  JOIN course_lessons cl ON cl.id = lr.lesson_id
  WHERE cl.course_id = p_course_id;

  UPDATE courses
  SET rating = COALESCE(avg_rating, rating),
      updated_at = NOW()
  WHERE id = p_course_id;
END;
$$;

-- ========== 3. Trigger: al insertar/actualizar/borrar una valoración, actualizar rating del curso ==========
CREATE OR REPLACE FUNCTION trigger_update_course_rating_on_lesson_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT course_id INTO v_course_id FROM course_lessons WHERE id = OLD.lesson_id;
    IF v_course_id IS NOT NULL THEN
      PERFORM update_course_rating_from_lessons(v_course_id);
    END IF;
    RETURN OLD;
  END IF;

  SELECT course_id INTO v_course_id FROM course_lessons WHERE id = COALESCE(NEW.lesson_id, OLD.lesson_id);
  IF v_course_id IS NOT NULL THEN
    PERFORM update_course_rating_from_lessons(v_course_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_rating_update_course_rating ON lesson_ratings;
CREATE TRIGGER trg_lesson_rating_update_course_rating
  AFTER INSERT OR UPDATE OR DELETE ON lesson_ratings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_course_rating_on_lesson_rating();

-- ========== 4. Sincronizar students_count con compras actuales (una vez) ==========
UPDATE courses c
SET students_count = COALESCE(
  (SELECT COUNT(*)::integer FROM course_purchases cp WHERE cp.course_id = c.id AND cp.is_active = true),
  0
),
updated_at = NOW();

-- ========== 5. Sincronizar rating con valoraciones actuales (una vez) ==========
UPDATE courses c
SET rating = COALESCE(
  (SELECT ROUND(AVG(lr.rating)::numeric, 2)
   FROM lesson_ratings lr
   JOIN course_lessons cl ON cl.id = lr.lesson_id
   WHERE cl.course_id = c.id),
  c.rating
),
updated_at = NOW();
