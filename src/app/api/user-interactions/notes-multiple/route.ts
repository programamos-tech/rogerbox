import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
  const { session } = await getSession();
    
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const complement_id = searchParams.get('complement_id');

    if (!complement_id) {
      return NextResponse.json({ error: 'Complement ID is required' }, { status: 400 });
    }

    // Obtener la interacción existente
    const { data: interaction, error: fetchError } = await supabase
      .from('user_complement_interactions')
      .select('notes_array')
      .eq('user_id', session.user.id)
      .eq('complement_id', complement_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching interaction:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    const notes = interaction?.notes_array || [];

    return NextResponse.json({ notes: notes });
  } catch (error) {
    console.error('Error in GET /api/user-interactions/notes-multiple:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
  const { session } = await getSession();
    
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { complement_id, note } = body;

    if (!complement_id || !note) {
      return NextResponse.json({ error: 'Complement ID and note are required' }, { status: 400 });
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

    // Obtener la interacción existente
    const { data: existingInteraction } = await supabase
      .from('user_complement_interactions')
      .select('notes_array')
      .eq('user_id', session.user.id)
      .eq('complement_id', complement_id)
      .single();

    const currentNotes = existingInteraction?.notes_array || [];
    const newNote = {
      id: Date.now().toString(), // ID simple basado en timestamp
      note: note.trim(),
      created_at: new Date().toISOString()
    };
    
    const updatedNotes = [newNote, ...currentNotes];

    // Insertar o actualizar la interacción
    const { error } = await supabase
      .from('user_complement_interactions')
      .upsert({
        user_id: session.user.id,
        complement_id,
        notes_array: updatedNotes,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,complement_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      note: newNote 
    });
  } catch (error) {
    console.error('Error in POST /api/user-interactions/notes-multiple:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
