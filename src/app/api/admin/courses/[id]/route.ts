import { NextRequest, NextResponse } from 'next/server';
import { getUser, createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

function normalizeEmail(val?: string | null) {
  return (val || '').trim().toLowerCase();
}

function isAdminUser(user: { id?: string; email?: string; user_metadata?: any } | null) {
  if (!user) return false;
  const envId = (process.env.NEXT_PUBLIC_ADMIN_USER_ID || '').trim();
  const envEmail = normalizeEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com');
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
  } catch (err) {
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
    
    console.error('getUser() error:', userError);
    
    // Fallback: intentar con getSession()
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (!sessionError && session?.user) {
      return session.user;
    }
    
    console.error('getSession() error:', sessionError);
    
    // Último fallback: extraer token manualmente de cookies
    const token = await extractAccessTokenFromCookies();
    if (token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        return data.user;
      }
      console.error('getUser(token) error:', error);
    }

    return null;
  } catch (err) {
    console.error('Session unexpected error:', err);
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Debug: Log cookies recibidas
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const authCookies = allCookies.filter((c) => c.name.includes('auth'));
    console.log('🔍 DELETE Courses - Cookies recibidas:', {
      totalCookies: allCookies.length,
      authCookies: authCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
    });
    
    const user = await getSessionUser();
    
    console.log('🔍 DELETE Courses - Usuario obtenido:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.user_metadata?.role,
      envId: process.env.NEXT_PUBLIC_ADMIN_USER_ID,
      envEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      isAdmin: isAdminUser(user),
    });

    if (!isAdminUser(user)) {
      // Fallback dev bypass: si no hay user pero estamos en dev y hay service key, permitir
      const nodeEnv = String(process.env.NODE_ENV || 'development');
      const isNotProduction = nodeEnv !== 'production' && nodeEnv !== 'prod';
      if (isNotProduction && process.env.SUPABASE_SERVICE_ROLE_KEY && !user) {
        console.warn('⚠️ Bypassing admin check in dev for courses DELETE (no user found)');
        // Continuar con la eliminación usando supabaseAdmin
      } else {
        console.error('❌ Courses DELETE unauthorized', {
          userId: user?.id,
          userEmail: user?.email,
          envId: process.env.NEXT_PUBLIC_ADMIN_USER_ID,
          envEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
          role: user?.user_metadata?.role,
          isAdmin: isAdminUser(user),
          nodeEnv: process.env.NODE_ENV,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    console.log('🗑️ API: Eliminando curso:', id);

    // Primero eliminar lecciones relacionadas
    const { error: lessonsError } = await supabaseAdmin
      .from('course_lessons')
      .delete()
      .eq('course_id', id);

    if (lessonsError) {
      console.error('❌ Error eliminando lecciones:', lessonsError);
      return NextResponse.json(
        { error: `Error al eliminar lecciones: ${lessonsError.message}` },
        { status: 500 }
      );
    }

    // Luego eliminar el curso
    const { data: deletedData, error: courseError } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', id)
      .select();

    if (courseError) {
      console.error('❌ Error eliminando curso:', courseError);
      return NextResponse.json(
        { error: `Error al eliminar curso: ${courseError.message}` },
        { status: 500 }
      );
    }

    if (!deletedData || deletedData.length === 0) {
      return NextResponse.json(
        { error: 'El curso no se pudo eliminar o ya no existe' },
        { status: 404 }
      );
    }

    console.log('✅ Curso eliminado exitosamente:', deletedData);

    return NextResponse.json({ 
      success: true, 
      deleted: deletedData 
    });
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

