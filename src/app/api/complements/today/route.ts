import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Obtener número de semana ISO del año
function getWeekNumber(date: Date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export async function GET() {
  try {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();

    // Obtener día de la semana (1=Lunes, 7=Domingo)
    let dayOfWeek = now.getDay();
    dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

    // Si es fin de semana (6=Sábado, 7=Domingo), usar viernes (5)
    const targetDay = dayOfWeek >= 6 ? 5 : dayOfWeek;
    const isWeekend = dayOfWeek >= 6;

    console.log('🔍 API complements/today:', {
      currentWeek,
      currentYear,
      dayOfWeek,
      targetDay,
      isWeekend,
    });

    const { data, error } = await supabaseAdmin
      .from('weekly_complements')
      .select('*')
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .eq('day_of_week', targetDay)
      .eq('is_published', true)
      .maybeSingle();

    if (error) {
      console.log('❌ Error:', error.message);
      return NextResponse.json({
        complement: null,
        isWeekend,
        dayOfWeek,
        targetDay,
      });
    }

    if (!data) {
      return NextResponse.json({
        complement: null,
        isWeekend,
        dayOfWeek,
        targetDay,
      });
    }

    return NextResponse.json({
      complement: data,
      isWeekend,
      dayOfWeek,
    });
  } catch (error) {
    console.error('Error in complements/today:', error);
    return NextResponse.json(
      { error: 'Error al obtener complemento' },
      { status: 500 },
    );
  }
}
