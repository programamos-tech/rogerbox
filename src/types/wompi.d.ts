// Tipos para Wompi Checkout (según documentación oficial)
declare global {
  interface Window {
    WidgetCheckout: new (config: {
      publicKey: string;
      amountInCents: number;
      currency: string;
      reference: string;
      redirectUrl?: string;
      signature?: {
        integrity: string;
      };
      customerData: {
        email: string;
        fullName?: string;
        phoneNumber?: string;
        phoneNumberPrefix?: string;
      };
    }) => {
      open: (callback: (result: unknown) => void) => void;
    };
  }
}

export {};
