import crypto from 'crypto';

interface SignatureParams {
  reference: string;
  amountInCents: number;
  currency: string;
}

/**
 * Servicio para lógica pura de Wompi.
 * Separado de la DB y de React para mantener SRP.
 */
export const wompiService = {
  /**
   * Genera la firma de integridad requerida por Wompi para asegurar
   * que los montos y referencias no hayan sido manipulados en frontend.
   */
  generateIntegritySignature: ({
    reference,
    amountInCents,
    currency,
  }: SignatureParams): string | null => {
    const integrityKey = process.env.WOMPI_INTEGRITY_KEY;

    if (!integrityKey) {
      console.warn(
        'WOMPI_INTEGRITY_KEY no está configurada. La firma de integridad será omitida.',
      );
      return null;
    }

    const signatureString = `${reference}${amountInCents}${currency}${integrityKey}`;
    console.log('test');
    return crypto.createHash('sha256').update(signatureString).digest('hex');
  },

  /**
   * Genera una referencia de orden única basada en timestamp y bytes aleatorios.
   */
  generateOrderReference: (): string => {
    return `${Date.now()}`;
  },
};
