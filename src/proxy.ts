import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // timeout para evitar bloqueo
  const SESSION_TIMEOUT_MS = 2500;

  let session = null;

  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), SESSION_TIMEOUT_MS)
      ),
    ]);

    session = result?.data?.session ?? null;
  } catch {
    session = null;
  }

  const { pathname } = req.nextUrl;

  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/reset-password',
    '/auth/callback',
    '/api/auth',
    '/api/andres',
  ];

  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  if (!session && !isPublicPath) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  if (session && (pathname === '/login' || pathname === '/register')) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}