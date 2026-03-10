import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación con Supabase Auth
    const { session } = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const folder = formData.get('folder') as string;
    const filename = formData.get('filename') as string;

    if (!file || !bucket || !folder) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: file, bucket, folder' },
        { status: 400 },
      );
    }

    // Validar que el bucket sea válido
    const validBuckets = [
      'course-image',
      'lesson-image',
      'lesson-images',
      'banners',
      'feed-images',
      'avatars',
    ];
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json(
        {
          error: `Bucket inválido. Debe ser uno de: ${validBuckets.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Generar nombre único si no se proporciona
    const fileExtension = file.name.split('.').pop() || 'webp';
    const finalFilename =
      filename ||
      `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `${folder}/${finalFilename}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verificar que el bucket existe; si no, crearlo (solo para buckets conocidos)
    const { data: buckets, error: listError } =
      await supabaseAdmin.storage.listBuckets();
    const bucketNames = buckets?.map((b) => b.name) ?? [];
    if (listError) {
    }

    if (!bucketNames.includes(bucket)) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(
        bucket,
        {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        },
      );
      if (createError) {
        return NextResponse.json(
          {
            error: `Bucket "${bucket}" no existe y no se pudo crear: ${createError.message}`,
          },
          { status: 500 },
        );
      }
    }

    // Subir archivo a Supabase Storage usando supabaseAdmin
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type || 'image/webp',
        cacheControl: '31536000', // Cache por 1 año
        upsert: true, // Permitir sobrescribir archivos existentes
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
