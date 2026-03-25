/**
 * Sustituye en textos de UI "complemento(s)" por "reto(s)" para el usuario final.
 * No altera "complementar" (verbo) ni rutas/APIs.
 */
export function complementoToRetoInUi(text: string): string {
  if (!text) return text;
  return text
    .replace(/\bcomplementos\b/gi, (m) =>
      m[0] === m[0].toUpperCase() ? 'Retos' : 'retos',
    )
    .replace(/\bcomplemento\b/gi, (m) =>
      m[0] === m[0].toUpperCase() ? 'Reto' : 'reto',
    );
}
