import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ notifications: [] });
    }

    const { data: rows, error } = await supabase
      .from('user_notifications')
      .select('id, type, title, message, link, post_id, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Error al cargar notificaciones' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      notifications: (rows || []).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        post_id: n.post_id,
        read_at: n.read_at,
        created_at: n.created_at,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al cargar notificaciones' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, mark_all } = body as { id?: string; mark_all?: boolean };

    if (mark_all) {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);
      if (error) {
        return NextResponse.json(
          { error: error.message || 'Error al marcar notificaciones' },
          { status: 500 },
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (id) {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) {
        return NextResponse.json(
          { error: error.message || 'Error al marcar notificación' },
          { status: 500 },
        );
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: 'Falta id o mark_all' },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar notificación' },
      { status: 500 },
    );
  }
}
