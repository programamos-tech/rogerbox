import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
  const { session } = await getSession();
    
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { complement_id } = body;

    if (!complement_id) {
      return NextResponse.json({ error: 'Complement ID is required' }, { status: 400 });
    }

    // Verificar que el complemento existe (puede estar en complements o weekly_complements)
    let complementExists = false;
    
    // Primero buscar en weekly_complements
    const { data: weeklyComplement } = await supabaseAdmin
      .from('weekly_complements')
      .select('id')
      .eq('id', complement_id)
      .single();
    
    if (weeklyComplement) {
      complementExists = true;
    } else {
      // Si no está en weekly_complements, buscar en complements
      const { data: regularComplement } = await supabaseAdmin
        .from('complements')
        .select('id')
        .eq('id', complement_id)
        .eq('is_active', true)
        .single();
      
      if (regularComplement) {
        complementExists = true;
      }
    }

    if (!complementExists) {
      return NextResponse.json({ error: 'Complement not found' }, { status: 404 });
    }

    // Obtener la interacción actual
    const { data: currentInteraction } = await supabaseAdmin
      .from('user_complement_interactions')
      .select('times_completed, last_completed_at')
      .eq('user_id', session.user.id)
      .eq('complement_id', complement_id)
      .single();

    const currentTimesCompleted = currentInteraction?.times_completed || 0;
    // Siempre incrementar el contador cuando se hace clic
    const newTimesCompleted = currentTimesCompleted + 1;

    // Insertar o actualizar la interacción
    const { data, error } = await supabaseAdmin
      .from('user_complement_interactions')
      .upsert({
        user_id: session.user.id,
        complement_id,
        is_completed: true, // Siempre marcar como completado
        times_completed: newTimesCompleted,
        last_completed_at: new Date().toISOString(), // Siempre actualizar la fecha
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,complement_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating completion:', error);
      return NextResponse.json({ error: 'Failed to update completion' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      is_completed: true, // Siempre devolver true
      times_completed: data.times_completed,
      last_completed_at: data.last_completed_at
    });
  } catch (error) {
    console.error('Error in POST /api/user-interactions/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
