export type GymPaymentAmountLike = {
  amount?: number | null;
  credit_applied?: number | null;
  payment_method?: string | null;
};

export function gymPaymentCashAmount(payment: GymPaymentAmountLike): number {
  return Math.max(0, Number(payment.amount || 0));
}

export function gymPaymentCreditApplied(payment: GymPaymentAmountLike): number {
  return Math.max(0, Number(payment.credit_applied || 0));
}

/** Total de la factura: caja + saldo a favor. */
export function gymPaymentInvoiceTotal(payment: GymPaymentAmountLike): number {
  return gymPaymentCashAmount(payment) + gymPaymentCreditApplied(payment);
}

export function gymPaymentMethodLabel(payment: GymPaymentAmountLike): string {
  const credit = gymPaymentCreditApplied(payment);
  const cash = gymPaymentCashAmount(payment);
  if (credit > 0 && cash <= 0) return 'Saldo a favor';
  if (credit > 0) return 'Caja + saldo';
  if (payment.payment_method === 'cash') return 'Efectivo';
  if (payment.payment_method === 'transfer') return 'Transferencia';
  if (payment.payment_method === 'mixed') return 'Mixto';
  return payment.payment_method || '—';
}
