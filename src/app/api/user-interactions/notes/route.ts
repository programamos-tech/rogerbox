import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
  const { session } = await getSession();
    
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { complement_id, personal_notes } = body;

    if (!complement_id) {
      return NextResponse.json({ error: 'Complement ID is required' }, { status: 400 });
    }

    // Verificar que el complemento existe
    const { data: complement, error: complementError } = await supabase
      .from('complements')
      .select('id')
      .eq('id', complement_id)
      .eq('is_active', true)
      .single();

    if (complementError || !complement) {
      return NextResponse.json({ error: 'Complement not found' }, { status: 404 });
    }

    // Insertar o actualizar las notas personales
    const { data, error } = await supabase
      .from('user_complement_interactions')
      .upsert({
        user_id: session.user.id,
        complement_id,
        personal_notes: personal_notes || '',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,complement_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating notes:', error);
      return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      personal_notes: data.personal_notes 
    });
  } catch (error) {
    console.error('Error in POST /api/user-interactions/notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
