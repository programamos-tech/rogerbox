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
    const { complement_id, rating } = body;

    if (!complement_id || !rating) {
      return NextResponse.json({ error: 'Complement ID and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
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

    // Insertar o actualizar la calificación
    const { data, error } = await supabase
      .from('user_complement_interactions')
      .upsert({
        user_id: session.user.id,
        complement_id,
        user_rating: rating,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,complement_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating rating:', error);
      return NextResponse.json({ error: 'Failed to update rating' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      user_rating: data.user_rating 
    });
  } catch (error) {
    console.error('Error in POST /api/user-interactions/rating:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
