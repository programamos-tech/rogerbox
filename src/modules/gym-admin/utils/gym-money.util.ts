export function formatCopAmount(amount: number): string {
  return `$${Math.round(Number(amount) || 0).toLocaleString('es-CO')}`;
}

export function formatCopHidden(hidden: boolean, amount: number): string {
  return hidden ? '••••••' : formatCopAmount(amount);
}
