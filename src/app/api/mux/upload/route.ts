import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convertir el archivo a base64 para enviar a Mux
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Crear asset en Mux
    const muxResponse = await fetch('https://api.mux.com/video/v1/assets', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_MUX_TOKEN_ID}:${process.env.MUX_SECRET_KEY}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: dataUrl,
        playback_policy: 'public',
        encoding_tier: 'smart', // Para optimización automática
      }),
    });

    if (!muxResponse.ok) {
      const error = await muxResponse.text();
      console.error('Mux API error:', error);
      return NextResponse.json({ error: 'Failed to upload to Mux' }, { status: 500 });
    }

    const muxData = await muxResponse.json();
    
    return NextResponse.json({
      success: true,
      playbackId: muxData.data.playback_ids[0].id,
      assetId: muxData.data.id,
      status: muxData.data.status,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
