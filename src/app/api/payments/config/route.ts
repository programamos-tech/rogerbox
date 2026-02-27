import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
    
    if (!publicKey) {
      return NextResponse.json(
        { error: 'Wompi public key not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publicKey,
      environment: process.env.WOMPI_ENVIRONMENT || 'sandbox'
    });

  } catch (error) {
    console.error('Error getting Wompi config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
