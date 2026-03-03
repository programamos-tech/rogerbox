interface WompiConfig {
  publicKey: string;
}

export const openWompiCheckout = ({
  publicKey,
  amountInCents,
  reference,
  redirectUrl,
  customerEmail,
  fullName,
  signature,
}: {
  publicKey: string;
  amountInCents: number;
  reference: string;
  redirectUrl: string;
  customerEmail: string;
  fullName: string;
  signature?: string;
}) => {
  if (typeof window.WidgetCheckout !== 'function') {
    throw new Error('Wompi widget not loaded');
  }

  const config: any = {
    currency: 'COP',
    amountInCents,
    reference,
    publicKey,
    redirectUrl,
    customerData: {
      email: customerEmail,
      fullName,
    },
  };

  if (signature) {
    config.signature = { integrity: signature };
  }

  const checkout = new window.WidgetCheckout(config);
  checkout.open(() => {});
};
