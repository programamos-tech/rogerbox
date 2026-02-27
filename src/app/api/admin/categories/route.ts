import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase-server';
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

async function getSessionUser() {
  try {
    const { session, error: sessionError } = await getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      // Intentar recuperar token desde cookie sb-*-auth-token y validar con supabaseAdmin (fallback)
      const token = await extractAccessTokenFromCookies();
      if (token) {
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && data?.user) {
          return data.user;
        }
      }
      return null;
    }
    if (session?.user) return session.user;

    // Fallback: intentar recuperar token manualmente
    const token = await extractAccessTokenFromCookies();
    if (token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        return data.user;
      }
    }

    return null;
  } catch (err) {
    console.error('Session unexpected error:', err);
    return null;
  }
}

async function extractAccessTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const all = cookieStore.getAll();
    const authCookie = all.find((c) => c.name.includes('auth-token'));
    if (!authCookie?.value) return null;
    const parsed = JSON.parse(authCookie.value);
    return parsed?.access_token || null;
  } catch (err) {
    return null;
  }
}

export async function GET() {
  const user = await getSessionUser();

  if (!isAdminUser(user)) {
    console.error('Categories GET unauthorized', {
      userId: user?.id,
      userEmail: user?.email,
      envId: process.env.NEXT_PUBLIC_ADMIN_USER_ID,
      envEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      role: user?.user_metadata?.role,
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('course_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!isAdminUser(user)) {
    // Fallback dev bypass: si no hay session pero estamos en dev y hay service key, permitir
    if (process.env.NODE_ENV !== 'production' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Bypassing admin check in dev for categories POST');
    } else {
      console.error('Categories POST unauthorized', {
        userId: user?.id,
        userEmail: user?.email,
        envId: process.env.NEXT_PUBLIC_ADMIN_USER_ID,
        envEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
        role: user?.user_metadata?.role,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }

  const body = await request.json();
  const { name, description, icon, color, sort_order } = body;

  const { error } = await supabaseAdmin
    .from('course_categories')
    .insert([{
      name,
      description,
      icon,
      color,
      sort_order: sort_order ?? 0,
      is_active: true,
    }]);

  if (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(request: NextRequest) {
  const user = await getSessionUser();

  if (!isAdminUser(user)) {
    const nodeEnv = String(process.env.NODE_ENV || 'development');
    const isNotProduction = nodeEnv !== 'production' && nodeEnv !== 'prod';
    if (isNotProduction && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Bypassing admin check in dev for categories PUT');
    } else {
      console.error('Categories PUT unauthorized', {
        userId: user?.id,
        userEmail: user?.email,
        envId: process.env.NEXT_PUBLIC_ADMIN_USER_ID,
        envEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
        role: user?.user_metadata?.role,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }

  const body = await request.json();
  const { id, ...rest } = body;

  const { error } = await supabaseAdmin
    .from('course_categories')
    .update({
      ...rest,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Categories PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();

  if (!isAdminUser(user)) {
    const nodeEnv = String(process.env.NODE_ENV || 'development');
    const isNotProduction = nodeEnv !== 'production' && nodeEnv !== 'prod';
    if (isNotProduction && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Bypassing admin check in dev for categories DELETE');
    } else {
      console.error('Categories DELETE unauthorized', {
        userId: user?.id,
        userEmail: user?.email,
        envId: process.env.NEXT_PUBLIC_ADMIN_USER_ID,
        envEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
        role: user?.user_metadata?.role,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('course_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

