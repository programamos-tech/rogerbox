import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación con Supabase Auth
    const { session } = await getSession();

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
    const validBuckets = ['course-images', 'lesson-images', 'banners'];
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: `Bucket inválido. Debe ser uno de: ${validBuckets.join(', ')}` },
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
    console.log('🔧 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321');

    // Primero verificar que el bucket existe
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    console.log('📦 Buckets disponibles:', buckets?.map(b => b.name) || 'Error listando');
    if (listError) {
      console.error('❌ Error listando buckets:', listError);
    }

    // Subir archivo a Supabase Storage usando supabaseAdmin
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type || 'image/webp',
        cacheControl: '31536000', // Cache por 1 año
        upsert: true // Permitir sobrescribir archivos existentes
      });

    if (error) {
      console.error('❌ Error subiendo imagen:', error);
      console.error('❌ Detalles del error:', JSON.stringify(error, null, 2));
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



