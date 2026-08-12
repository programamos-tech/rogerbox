/** Valor por defecto cuando el cliente no tiene WhatsApp registrado (API / perfil). */
export function isPlaceholderGymWhatsapp(wa: string | null | undefined): boolean {
  if (!wa?.trim()) return false;
  return wa.replace(/\D/g, '') === '0000000000';
}

export function getGymWhatsappDigits(
  whatsapp: string | null | undefined,
): string | null {
  if (!whatsapp || isPlaceholderGymWhatsapp(whatsapp)) return null;
  const digits = whatsapp.replace(/\D/g, '');
  if (!digits) return null;
  return digits.length === 10 ? `57${digits}` : digits;
}

export function getGymWhatsappHref(
  whatsapp: string | null | undefined,
): string | null {
  const digits = getGymWhatsappDigits(whatsapp);
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}
