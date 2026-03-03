import { NextResponse } from 'next/server';

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;

  if (!publicKey) {
    console.error('Wompi public key missing');
    return NextResponse.json(
      { error: 'Payment system not configured' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      publicKey,
      environment: process.env.WOMPI_ENVIRONMENT ?? 'sandbox',
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
}
