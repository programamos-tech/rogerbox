/** Valor por defecto cuando el cliente no tiene WhatsApp registrado (API / perfil). */
export function isPlaceholderGymWhatsapp(wa: string | null | undefined): boolean {
  if (!wa?.trim()) return false;
  return wa.replace(/\D/g, '') === '0000000000';
}
