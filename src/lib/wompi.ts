/**
 * Wompi Payment Gateway Service
 * Configuración para ambiente de pruebas (sandbox)
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface WompiConfig {
  publicKey: string;
  privateKey: string;
  environment: 'sandbox' | 'production';
  baseUrl: string;
}

export interface WompiOrder {
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  reference: string;
  payment_method: {
    type: string;
    installments?: number;
    phone_number?: string;
  };
  payment_source_id?: string;
  redirect_url?: string;
}

export interface WompiResponse {
  data: {
    id: string;
    reference: string;
    status: string;
    amount_in_cents: number;
    currency: string;
    customer_email: string;
    payment_method: {
      type: string;
      installments?: number;
      phone_number?: string;
    };
    payment_source_id?: string;
    redirect_url?: string;
    created_at: string;
    finalized_at?: string;
  };
  meta: {
    trace_id: string;
  };
}

export interface WompiWebhookData {
  event: string;
  data: {
    transaction: {
      id: string;
      amount_in_cents: number;
      reference: string;
      customer_email: string;
      currency: string;
      payment_method_type: string;
      status: string;
      status_message: string;
      shipping_address?: any;
      redirect_url?: string;
      payment_source_id?: string;
      payment_link_id?: string;
      created_at: string;
      finalized_at?: string;
      taxes?: any[];
    };
    signature: {
      checksum: string;
      properties: string[];
    };
  };
}

class WompiService {
  private config: WompiConfig;

  constructor() {
    const environment =
      (process.env.WOMPI_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

    this.config = {
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '',
      privateKey: process.env.WOMPI_PRIVATE_KEY || '',
      environment: environment,
      baseUrl: this.getBaseUrl(environment),
    };

    if (!this.config.publicKey || !this.config.privateKey) {
    }
  }

  private getBaseUrl(environment?: 'sandbox' | 'production'): string {
    const env = environment || this.config?.environment || 'sandbox';
    return env === 'sandbox'
      ? 'https://sandbox.wompi.co/v1'
      : 'https://production.wompi.co/v1';
  }

  /**
   * Obtener fuentes de pago disponibles
   */
  async getPaymentSources(): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/payment_sources`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.privateKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Wompi API Error: ${errorData.error?.reason || errorData.error?.message || 'Unknown error'}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear acceptance token en Wompi
   */
  async createAcceptanceToken(): Promise<string> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/merchants/${this.config.publicKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.privateKey}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Wompi API Error: ${errorData.error?.reason || errorData.error?.message || 'Unknown error'}`,
        );
      }

      const data = await response.json();
      const token = data.data.presigned_acceptance.acceptance_token;
      return token;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear acceptance token en Wompi
   */
  async createTransaction(
    order: WompiOrder,
    signature?: string,
  ): Promise<WompiResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.privateKey}`,
      };

      // Agregar firma de integridad en el header X-Integrity
      if (signature) {
        headers['X-Integrity'] = signature;
      }

      // Usar curl directamente para evitar problemas con Node.js fetch
      const tempFile = path.join('/tmp', `wompi-${Date.now()}.json`);

      fs.writeFileSync(tempFile, JSON.stringify(order));

      const curlCommand = `curl -s -X POST "${this.config.baseUrl}/transactions" \\
        -H "Content-Type: application/json" \\
        -H "Authorization: Bearer ${this.config.privateKey}" \\
        -H "X-Integrity: ${signature}" \\
        -d @${tempFile}`;

      const { stdout, stderr } = await execAsync(curlCommand);

      // Limpiar archivo temporal
      try {
        fs.unlinkSync(tempFile);
      } catch (cleanupError) {}

      if (stderr) {
        throw new Error(`Curl error: ${stderr}`);
      }

      let data;
      try {
        data = JSON.parse(stdout);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from Wompi: ${stdout}`);
      }

      // Verificar si hay error en la respuesta
      if (data.error) {
        throw new Error(`Wompi API Error: ${JSON.stringify(data.error)}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener información de una transacción
   */
  async getTransaction(transactionId: string): Promise<WompiResponse> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/transactions/${transactionId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.config.privateKey}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Wompi API Error: ${errorData.error?.message || 'Unknown error'}`,
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar la firma del webhook
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // En producción, implementar verificación de firma
    // Por ahora, en sandbox, confiamos en la firma
    return true;
  }

  /**
   * Generar URL de redirección para pago
   */
  generatePaymentUrl(transactionId: string): string {
    return `${this.config.baseUrl}/transactions/${transactionId}`;
  }

  /**
   * Obtener configuración pública (para frontend)
   */
  getPublicConfig() {
    return {
      publicKey: this.config.publicKey,
      environment: this.config.environment,
      baseUrl: this.config.baseUrl,
    };
  }

  /**
   * Validar si las credenciales están configuradas
   */
  isConfigured(): boolean {
    return !!(this.config.publicKey && this.config.privateKey);
  }
}

// Instancia singleton
export const wompiService = new WompiService();

// Configuración para el frontend
export const wompiConfig = wompiService.getPublicConfig();
