/**
 * Estilos compartidos para vistas admin de detalle (plan, cliente, factura).
 * ERP minimalista: líneas, tipografía y acento #85ea10 (sin cajas tipo card).
 */
export const adminDetailStyles = {
  shell:
    'min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-[#0a1628] dark:to-gray-900',
  /** Tarjeta grande (precio, duración, etc.) */
  statCard:
    'rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/50 p-4 md:p-6',
  statLabel:
    'text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-[#164151]/60 dark:text-white/50',
  statValue:
    'text-2xl font-bold text-[#164151] dark:text-white tabular-nums',
  /** KPI compactos (fila secundaria) */
  kpiCard:
    'rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/40 px-4 py-3',
  kpiLabel:
    'flex items-center gap-2 text-[#164151]/60 dark:text-white/50 text-[10px] xs:text-xs font-semibold uppercase tracking-wide',
  kpiValue:
    'text-xl font-bold text-[#164151] dark:text-white mt-1 tabular-nums',
  /** Título de bloque (ficha cliente, historial, factura) */
  sectionHeading:
    'mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40',
  /** Texto de ayuda bajo el título */
  sectionHelper:
    'mb-4 text-[10px] leading-snug text-gray-500 dark:text-white/35',
  /** Separador entre bloques como en UserDetailContent */
  sectionBlock:
    'pb-8 border-b border-gray-200/60 dark:border-white/[0.06] last:border-b-0',
  /** Bloque superior: descripción + métricas (sin cards) */
  metricsBlock:
    'pb-8 border-b border-gray-200/60 dark:border-white/[0.06] mb-0',
  introEyebrow:
    'text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-white/40',
  /** Lista tipo ERP: filas separadas por línea */
  erpDefinitionList:
    'divide-y divide-gray-200/80 dark:divide-white/[0.08]',
  erpRow:
    'flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8',
  erpLabel:
    'text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40 shrink-0',
  erpValue:
    'text-base font-semibold text-[#164151] dark:text-white tabular-nums sm:text-right',
  erpValueAccent:
    'text-xl font-bold text-[#85ea10] tabular-nums sm:text-2xl sm:text-right',
  /** @deprecated usar sectionHeading + sectionHelper */
  sectionTitle: 'text-lg font-bold text-[#164151] dark:text-white',
  /** @deprecated usar sectionHelper */
  sectionDesc: 'text-sm text-[#164151]/70 dark:text-white/55',
  tableWrap:
    'overflow-x-auto border-t border-b border-gray-200/80 dark:border-white/[0.08]',
  th: 'text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45 px-3 py-3 first:pl-0 last:pr-0 bg-transparent border-b border-gray-200/80 dark:border-white/[0.08]',
  td: 'px-3 py-3 text-sm text-[#164151] dark:text-white/90 border-t border-gray-100/90 dark:border-white/[0.06] first:pl-0 last:pr-0',
  tableRow:
    'transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.03]',
  link: 'text-[#85ea10] hover:underline font-medium',
  badgeActive:
    'inline-flex items-center rounded-full bg-[#85ea10]/15 px-2 py-0.5 text-xs font-semibold text-[#85ea10]',
  badgeMuted:
    'inline-flex items-center rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-xs font-medium text-[#164151]/80 dark:text-white/70',
} as const;
