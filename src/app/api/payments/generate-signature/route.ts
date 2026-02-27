import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { reference, amountInCents, currency } = await request.json();

    if (!reference || !amountInCents || !currency) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Intentar con la llave privada primero, luego con la de integridad
    const privateKey = process.env.WOMPI_PRIVATE_KEY;
    const integrityKey = process.env.WOMPI_INTEGRITY_KEY;
    
    if (!privateKey && !integrityKey) {
      return NextResponse.json(
        { error: 'Wompi keys not configured' },
        { status: 500 }
      );
    }

    // Usar la llave de integridad para HMAC
    const keyToUse = integrityKey || privateKey;
    
    // Generar la firma de integridad según la documentación oficial de Wompi
    // Formato: reference + amount + currency (sin la key, se usa en HMAC)
    const signatureString = `${reference}${amountInCents}${currency}`;
    
    console.log('🔐 Signature string:', signatureString);
    console.log('🔑 Key used:', keyToUse?.substring(0, 10) + '...');
    
    // Crear el checksum usando HMAC-SHA256
    if (!keyToUse) {
      return NextResponse.json(
        { error: 'WOMPI_INTEGRITY_KEY no está configurado' },
        { status: 500 }
      );
    }
    
    const checksum = crypto
      .createHmac('sha256', keyToUse)
      .update(signatureString)
      .digest('hex');
    
    console.log('🔐 Generated checksum:', checksum);

    return NextResponse.json({
      checksum
    });

  } catch (error) {
    console.error('Error generating signature:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
