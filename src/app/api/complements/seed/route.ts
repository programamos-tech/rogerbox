import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const sampleComplements = [
      {
        title: 'Rutina de Cardio Intenso',
        description:
          'Quema calorías y mejora tu resistencia con esta rutina de alta intensidad.',
        category: 'Cardio',
        duration: 600, // 10 minutes
        is_new: true,
      },
      {
        title: 'Yoga para Principiantes',
        description:
          'Introducción suave al yoga para mejorar la flexibilidad y el equilibrio.',
        category: 'Yoga',
        duration: 900, // 15 minutes
        is_new: true,
      },
      {
        title: 'Entrenamiento de Fuerza con Bandas',
        description:
          'Fortalece tus músculos usando bandas de resistencia en casa o en el gimnasio.',
        category: 'Fuerza',
        duration: 1200, // 20 minutes
        is_new: false,
      },
      {
        title: 'Meditación Guiada para el Estrés',
        description:
          'Encuentra la calma y reduce el estrés con esta sesión de meditación guiada.',
        category: 'Relajación',
        duration: 300, // 5 minutes
        is_new: true,
      },
      {
        title: 'Rutina de Movilidad Articular',
        description:
          'Mejora el rango de movimiento de tus articulaciones y previene lesiones.',
        category: 'Movilidad',
        duration: 480, // 8 minutes
        is_new: false,
      },
      {
        title: 'HIIT para Quemar Grasa',
        description:
          'Entrenamiento de intervalos de alta intensidad para maximizar la quema de grasa.',
        category: 'Cardio',
        duration: 720, // 12 minutes
        is_new: true,
      },
      {
        title: 'Estiramientos Post-Entrenamiento',
        description:
          'Relaja tus músculos después del ejercicio con esta rutina de estiramientos.',
        category: 'Flexibilidad',
        duration: 600, // 10 minutes
        is_new: false,
      },
      {
        title: 'Pilates para el Core',
        description:
          'Fortalece tu core y mejora la estabilidad con ejercicios de Pilates.',
        category: 'Fuerza',
        duration: 900, // 15 minutes
        is_new: true,
      },
      {
        title: 'Respiración y Relajación',
        description:
          'Técnicas de respiración para reducir la ansiedad y mejorar el bienestar.',
        category: 'Bienestar',
        duration: 420, // 7 minutes
        is_new: false,
      },
      {
        title: 'Calentamiento Dinámico Completo',
        description:
          'Prepara tu cuerpo para cualquier actividad física con este calentamiento completo.',
        category: 'Calentamiento',
        duration: 540, // 9 minutes
        is_new: true,
      },
    ];

    const results = [];

    for (const complement of sampleComplements) {
      try {
        const { error } = await supabase.from('complements').insert({
          id: uuidv4(),
          title: complement.title,
          description: complement.description,
          video_url:
            'https://player.vimeo.com/video/1120425801?badge=0&autopause=0&player_id=0&app_id=58479',
          category: complement.category,
          duration: complement.duration,
          thumbnail_url: `https://via.placeholder.com/300x533?text=${encodeURIComponent(complement.title)}`,
          is_new: complement.is_new,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) {
          results.push({
            title: complement.title,
            status: 'error',
            error: error.message,
          });
        } else {
          results.push({ title: complement.title, status: 'success' });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        results.push({
          title: complement.title,
          status: 'error',
          error: message,
        });
      }
    }

    // Verificar cuántos complementos hay ahora
    const { data: allComplements, error: fetchError } = await supabase
      .from('complements')
      .select('id, title, category, is_new');

    if (fetchError) {
    }

    return NextResponse.json({
      success: true,
      message: `Seed completado. ${results.filter((r) => r.status === 'success').length} complementos agregados.`,
      results,
      totalComplements: allComplements?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 },
    );
  }
}
