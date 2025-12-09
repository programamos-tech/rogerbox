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

    const { data, error } = await supabase
      .from('user_complement_comments')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('complement_id', complement_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json({ comments: data });
  } catch (error) {
    console.error('Error in GET /api/user-interactions/comments:', error);
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
    const { complement_id, comment } = body;

    if (!complement_id || !comment) {
      return NextResponse.json({ error: 'Complement ID and comment are required' }, { status: 400 });
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

    // Insertar el comentario
    const { data, error } = await supabase
      .from('user_complement_comments')
      .insert({
        user_id: session.user.id,
        complement_id,
        comment: comment.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      comment: data 
    });
  } catch (error) {
    console.error('Error in POST /api/user-interactions/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
