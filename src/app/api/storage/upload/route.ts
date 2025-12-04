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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const folder = formData.get('folder') as string;
    const filename = formData.get('filename') as string;

    if (!file || !bucket || !folder) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: file, bucket, folder' },
        { status: 400 }
      );
    }

    // Validar que el bucket sea válido
    if (bucket !== 'course-images' && bucket !== 'lesson-images') {
      return NextResponse.json(
        { error: 'Bucket inválido. Debe ser "course-images" o "lesson-images"' },
        { status: 400 }
      );
    }

    // Generar nombre único si no se proporciona
    const fileExtension = file.name.split('.').pop() || 'webp';
    const finalFilename = filename || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `${folder}/${finalFilename}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`📤 Subiendo imagen a ${bucket}/${filePath} (${buffer.length} bytes)`);

    // Subir archivo a Supabase Storage usando supabaseAdmin
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type || 'image/webp',
        cacheControl: '31536000', // Cache por 1 año
        upsert: false // No sobrescribir archivos existentes
      });

    if (error) {
      console.error('❌ Error subiendo imagen:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('✅ Imagen subida exitosamente:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path
    });

  } catch (error) {
    console.error('❌ Error inesperado subiendo imagen:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}



