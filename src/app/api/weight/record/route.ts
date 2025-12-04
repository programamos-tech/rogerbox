import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { weight, record_date, notes } = body;

    if (!weight || isNaN(Number(weight))) {
      return NextResponse.json(
        { error: 'Peso inválido' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Insertar registro de peso usando supabaseAdmin (bypass RLS)
    const { data: weightData, error: weightRecordError } = await supabaseAdmin
      .from('weight_records')
      .insert({
        user_id: userId,
        weight: Number(weight),
        record_date: record_date || new Date().toISOString().split('T')[0],
        notes: notes || null
      })
      .select()
      .single();

    if (weightRecordError) {
      console.error('Error guardando registro de peso:', weightRecordError);
      return NextResponse.json(
        { error: weightRecordError.message || 'Error al guardar el registro de peso' },
        { status: 500 }
      );
    }

    // Actualizar también el peso actual en el perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        current_weight: Number(weight),
        last_weight_update: record_date || new Date().toISOString().split('T')[0]
      })
      .eq('id', userId);

    if (profileError) {
      console.warn('Error actualizando perfil (no crítico):', profileError);
      // No fallar si el perfil no se actualiza
    }

    return NextResponse.json({
      success: true,
      data: weightData
    });

  } catch (error) {
    console.error('❌ Error inesperado guardando peso:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}



