import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient, getUser } from '@/lib/supabase-server';

function normalizeEmail(val?: string | null) {
  return (val || '').trim().toLowerCase();
}

function isAdminUser(
  user: {
    id?: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null,
) {
  if (!user) return false;
  const envId = (process.env.NEXT_PUBLIC_ADMIN_USER_ID || '').trim();
  const envEmail = normalizeEmail(
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com',
  );
  const matchId = !!envId && user.id === envId;
  const matchEmail = normalizeEmail(user.email) === envEmail;
  const matchRole = user.user_metadata?.role === 'admin';
  return Boolean(matchId || matchEmail || matchRole);
}

async function extractAccessTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const all = cookieStore.getAll();

    // Buscar todas las cookies que puedan contener el token de auth
    for (const cookie of all) {
      if (cookie.name.includes('auth-token') || cookie.name.includes('sb-')) {
        try {
          const parsed = JSON.parse(cookie.value);
          if (parsed?.access_token) {
            return parsed.access_token;
          }
        } catch {
          // Si no es JSON, podría ser el token directamente
          if (cookie.value.length > 100) {
            return cookie.value;
          }
        }
      }
    }
    return null;
  } catch (_err) {
    return null;
  }
}

async function getSessionUser() {
  try {
    // Primero intentar con getUser() que es más confiable
    const { user, error: userError } = await getUser();
    if (!userError && user) {
      return user;
    }

    // Fallback: intentar con getSession()
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (!sessionError && session?.user) {
      return session.user;
    }

    // Último fallback: extraer token manualmente de cookies
    const token = await extractAccessTokenFromCookies();
    if (token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        return data.user;
      }
    }

    return null;
  } catch (_err) {
    return null;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Debug: Log cookies recibidas
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const _authCookies = allCookies.filter((c) => c.name.includes('auth'));
    const user = await getSessionUser();

    if (!isAdminUser(user)) {
      // Fallback dev bypass: si no hay user pero estamos en dev y hay service key, permitir
      const nodeEnv = String(process.env.NODE_ENV || 'development');
      const isNotProduction = nodeEnv !== 'production' && nodeEnv !== 'prod';
      if (isNotProduction && process.env.SUPABASE_SERVICE_ROLE_KEY && !user) {
        // Continuar con la eliminación usando supabaseAdmin
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Primero eliminar lecciones relacionadas
    const { error: lessonsError } = await supabaseAdmin
      .from('course_lessons')
      .delete()
      .eq('course_id', id);

    if (lessonsError) {
      return NextResponse.json(
        { error: `Error al eliminar lecciones: ${lessonsError.message}` },
        { status: 500 },
      );
    }

    // Luego eliminar el curso
    const { data: deletedData, error: courseError } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', id)
      .select();

    if (courseError) {
      return NextResponse.json(
        { error: `Error al eliminar curso: ${courseError.message}` },
        { status: 500 },
      );
    }

    if (!deletedData || deletedData.length === 0) {
      return NextResponse.json(
        { error: 'El curso no se pudo eliminar o ya no existe' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      deleted: deletedData,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
