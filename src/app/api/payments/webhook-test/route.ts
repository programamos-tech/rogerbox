import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    console.log('🔔 Webhook test received');
    
    const body = await request.text();
    console.log('📥 Webhook body:', body);
    
    const headers = Object.fromEntries(request.headers.entries());
    console.log('📥 Webhook headers:', headers);
    
    // Responder con HTTP 200 y un JSON simple
    return NextResponse.json({ 
      success: true,
      message: 'Webhook test received successfully',
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Error in webhook test:', error);
    
    // Incluso en caso de error, responder con 200 para evitar reintentos
    return NextResponse.json(
      { 
        success: false,
        error: 'Webhook test error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 200, // Cambiar a 200 para evitar reintentos
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
