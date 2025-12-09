import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data: banners, error } = await supabaseAdmin
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Error al obtener banners' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session } = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { title, image_url, link_url } = body;

    if (!image_url) {
      return NextResponse.json({ error: 'La URL de imagen es requerida' }, { status: 400 });
    }

    // Obtener el orden máximo actual
    const { data: maxOrder } = await supabaseAdmin
      .from('banners')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const newOrder = (maxOrder?.display_order || 0) + 1;

    const { data, error } = await supabaseAdmin
      .from('banners')
      .insert({
        title,
        image_url,
        link_url,
        display_order: newOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ banner: data });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ error: 'Error al crear banner' }, { status: 500 });
  }
}



