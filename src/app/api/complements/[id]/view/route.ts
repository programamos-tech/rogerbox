import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Obtener el valor actual de visualizaciones
    const { data: currentStats, error: fetchError } = await supabase
      .from('complement_stats')
      .select('total_views')
      .eq('complement_id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching current stats:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch current stats' }, { status: 500 });
    }

    // Incrementar el contador de visualizaciones
    const { data, error } = await supabase
      .from('complement_stats')
      .update({
        total_views: (currentStats.total_views || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('complement_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error incrementing views:', error);
      return NextResponse.json({ error: 'Failed to increment views' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      total_views: data.total_views 
    });
  } catch (error) {
    console.error('Error in POST /api/complements/[id]/view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
