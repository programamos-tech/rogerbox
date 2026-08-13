export { adminDetailStyles as gymPlanDetailStyles } from '@/shared/styles/admin-detail.styles';

/**
 * Modal de formularios admin (planes, clientes, pagos).
 * Misma caja/overlay; tipografía text-sm alineada al resto del ERP.
 */
export const adminFormModalStyles = {
  overlay:
    'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/70 md:left-[var(--admin-sidebar-width,14rem)]',
  panel:
    'w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-gray-900',
  header:
    'flex items-center justify-between gap-3 border-b border-gray-200 p-5 dark:border-white/10 sm:p-6',
  title: 'text-lg font-semibold text-[#164151] dark:text-white',
  closeBtn:
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#164151]/80 transition-colors hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/10',
  body: 'space-y-5 p-5 sm:p-6',
  sectionTitle:
    'text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40',
  label: 'mb-2 block text-sm font-semibold text-[#164151] dark:text-white',
  input:
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#164151] placeholder-gray-400 transition-all focus:border-[#85ea10]/50 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-white/40',
  inputIcon:
    'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400',
  inputWithIcon:
    'w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-4 text-sm text-[#164151] placeholder-gray-400 transition-all focus:border-[#85ea10]/50 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-white/40',
  helper: 'mt-1 text-xs text-gray-500 dark:text-white/40',
  footer:
    'flex items-center justify-end gap-3 border-t border-gray-200 pt-5 dark:border-white/10',
  btnCancel:
    'rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-[#164151] transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
  btnPrimary:
    'inline-flex items-center gap-2 rounded-lg bg-[#164151] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a4d5f] disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-white/90',
} as const;

export const gymPlansListStyles = {
  tableShell:
    'bg-white dark:bg-[#0c1628] rounded-2xl border border-gray-200 dark:border-white/[0.06] overflow-hidden',
  tableWrap: 'overflow-x-auto',
  table: 'w-full min-w-[860px]',
  th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40 bg-gray-50/90 dark:bg-white/[0.025] border-b border-gray-200 dark:border-white/[0.05] whitespace-nowrap',
  thLeft: 'text-left',
  thRight: 'text-right',
  sortButton:
    'inline-flex items-center gap-1.5 hover:text-[#164151] dark:hover:text-white transition-colors',
  /** En dark: sin rayas entre filas (solo hover) para lectura más liviana */
  td: 'px-4 py-3.5 text-sm text-[#164151] dark:text-white/90 border-b border-gray-100 dark:border-transparent',
  row: 'cursor-pointer transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.035]',
  planName: 'font-semibold text-[#164151] dark:text-white leading-tight',
  planDesc: 'text-xs text-[#164151]/55 dark:text-white/40 mt-0.5 line-clamp-1',
  badgeActive:
    'inline-flex items-center rounded-full bg-[#85ea10]/15 px-2 py-0.5 text-[11px] font-semibold text-[#3f7d08] dark:text-[#85ea10]',
  badgeInactive:
    'inline-flex items-center rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:text-white/50',
  price: 'font-bold tabular-nums whitespace-nowrap',
  priceCurrency:
    'text-[11px] font-semibold text-gray-400 dark:text-white/35 ml-1',
  clientCount: 'font-semibold tabular-nums',
  clientCountEmpty: 'tabular-nums text-gray-400 dark:text-white/30',
  actionBtn:
    'inline-flex items-center justify-center w-9 h-9 rounded-lg text-[#164151]/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors',
  actionDanger:
    'inline-flex items-center justify-center w-9 h-9 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors',
  footer:
    'flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02]',
  footerText:
    'text-xs font-medium text-gray-500 dark:text-white/45 tabular-nums',
  durationGrid: 'grid grid-cols-2 sm:grid-cols-3 gap-2',
  durationChip:
    'px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors',
  durationChipOn:
    'border-[#85ea10]/40 bg-[#85ea10]/15 text-[#164151] dark:text-white',
  durationChipOff:
    'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[#164151]/70 dark:text-white/60 hover:border-gray-300 dark:hover:border-white/20',
} as const;

export const gymPlanClientsStyles = {
  ...gymPlansListStyles,
  table: 'w-full min-w-[980px]',
  rowStatic: 'transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.04]',
  badgePeriod:
    'inline-flex items-center rounded-full bg-[#85ea10]/15 px-2 py-0.5 text-[11px] font-semibold text-[#3f7d08] dark:text-[#85ea10]',
  badgeEndingSoon:
    'inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-400',
  badgeScheduled:
    'inline-flex items-center rounded-full bg-cyan-500/12 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-400',
  badgeExpired:
    'inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400',
  pager:
    'flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02]',
  pagerBtn:
    'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 text-[#164151] dark:text-white/80 hover:bg-white dark:hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none',
  pagerBtnActive:
    'inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#164151] px-2 text-xs font-semibold text-white',
  pagerBtnPage:
    'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 px-2 text-xs font-semibold text-[#164151] dark:text-white/80 hover:bg-white dark:hover:bg-white/10',
  periodDates:
    'tabular-nums whitespace-nowrap text-[#164151] dark:text-white/85',
  periodSep: 'mx-1.5 text-gray-300 dark:text-white/25',
  progressCell: 'min-w-[160px]',
  progressTrack:
    'relative h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-gray-200/90 dark:bg-white/10',
  progressFill: 'h-full rounded-full bg-[#85ea10]',
  progressFillSoon:
    'h-full rounded-full bg-gradient-to-r from-[#85ea10] to-amber-500',
  progressFillScheduled: 'h-full rounded-full bg-cyan-500/50',
  progressFillExpired: 'h-full rounded-full bg-red-500/70',
  progressMeta:
    'mt-1 text-[11px] tabular-nums text-gray-500 dark:text-white/45',
  progressMetaWarn:
    'mt-1 text-[11px] font-semibold tabular-nums text-amber-700 dark:text-amber-400',
  historyMuted: 'text-xs tabular-nums text-gray-400 dark:text-white/35',
  whatsappLink:
    'text-sm tabular-nums text-[#164151] dark:text-white/85 hover:text-[#85ea10] hover:underline underline-offset-2 whitespace-nowrap',
  /** Toolbar compacta tipo ERP bajo el navbar global */
  detailToolbar:
    'flex flex-col gap-2.5 pb-3 mb-4 border-b border-gray-200/70 dark:border-white/[0.08] lg:flex-row lg:items-center lg:justify-between lg:gap-4',
  detailMetaRow:
    'flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 text-sm text-[#164151] dark:text-white/85',
  detailPrice: 'font-bold tabular-nums text-base sm:text-lg tracking-tight',
  detailPriceCurrency:
    'ml-1 text-[11px] font-semibold text-gray-400 dark:text-white/35',
  detailMetaMuted: 'text-xs text-gray-500 dark:text-white/45',
  detailMetaSep: 'text-gray-300 dark:text-white/20',
  detailDesc:
    'text-xs text-gray-500 dark:text-white/40 truncate max-w-xl hidden xl:inline',
  detailActions:
    'flex flex-wrap items-center gap-2 w-full lg:w-auto lg:shrink-0',
  detailSearch: 'relative flex-1 min-w-[180px] lg:w-64 lg:flex-none',
  detailSearchInput:
    'w-full h-9 rounded-lg border border-gray-200/80 bg-white/80 pl-8 pr-2.5 text-sm text-[#164151] outline-none transition focus:border-[#85ea10]/55 focus:ring-1 focus:ring-[#85ea10]/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-white',
  detailFilter: 'relative w-full sm:w-[170px]',
  detailFilterSelect:
    'w-full h-9 appearance-none rounded-lg border border-gray-200/80 bg-white/80 pl-8 pr-2.5 text-sm text-[#164151] outline-none transition focus:border-[#85ea10]/55 focus:ring-1 focus:ring-[#85ea10]/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-white',
  detailBackBtn:
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#164151] px-3 text-sm font-semibold text-white hover:bg-[#1a4d5f] transition-colors',
  detailSectionHead: 'flex flex-wrap items-baseline justify-between gap-2 mb-3',
  detailSectionTitle:
    'text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40',
  detailSectionHelper: 'text-[10px] text-gray-500 dark:text-white/35',
} as const;

/** Anchos de columna Clientes (inline en <col>; Tailwind en col es poco fiable) */
export const gymClientsColWidths = {
  client: '29%',
  doc: '14%',
  products: '21%',
  type: '10%',
  status: '13%',
  /** Cabe ~4 iconos; alineados al inicio para quedar junto a Estado */
  actions: '13%',
} as const;

/** Lista global de Clientes — misma densidad/tabla que Planes */
export const gymClientsListStyles = {
  ...gymPlanClientsStyles,
  /** Sin min-width ni scroll horizontal: la tabla se adapta al ancho disponible */
  tableWrap: 'w-full overflow-hidden',
  table: 'w-full table-fixed',
  th: 'px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40 bg-gray-50/90 dark:bg-white/[0.025] border-b border-gray-200 dark:border-white/[0.05]',
  td: 'px-3 py-2.5 text-sm text-[#164151] dark:text-white/90 border-b border-gray-100 dark:border-transparent overflow-hidden align-middle',
  actionBtn:
    'inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#164151]/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0',
  whatsappAction:
    'inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#1ebe57] transition-colors shrink-0',
  toolbar:
    'bg-white dark:bg-[#0c1628] rounded-2xl border border-gray-200 dark:border-white/10 p-3 sm:p-4',
  toolbarRow: 'flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3',
  searchWrap: 'relative flex-1 min-w-0',
  searchIcon:
    'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/40',
  searchInput:
    'w-full h-9 rounded-lg border border-gray-200/80 bg-white/80 pl-9 pr-3 text-sm text-[#164151] outline-none transition focus:border-[#85ea10]/55 focus:ring-1 focus:ring-[#85ea10]/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35',
  filtersRow: 'grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-2 lg:shrink-0',
  filterWrap: 'relative min-w-0 sm:w-[168px]',
  filterIcon:
    'pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-white/40',
  filterSelect:
    'w-full h-9 appearance-none rounded-lg border border-gray-200/80 bg-white/80 pl-8 pr-2.5 text-xs sm:text-sm text-[#164151] outline-none transition focus:border-[#85ea10]/55 focus:ring-1 focus:ring-[#85ea10]/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-white cursor-pointer',
  primaryBtn:
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#164151] px-3.5 text-sm font-semibold text-white hover:bg-[#1a4d5f] transition-colors lg:ml-auto shrink-0',
  clientName:
    'truncate text-sm font-semibold text-[#164151] dark:text-white leading-tight',
  clientEmail: 'mt-0.5 truncate text-xs text-[#164151]/55 dark:text-white/40',
  docCell:
    'inline-flex max-w-full items-center gap-1 text-xs font-medium tabular-nums text-[#164151] dark:text-white/85 truncate',
  productName:
    'min-w-0 truncate text-sm font-medium text-[#164151] dark:text-white',
  productMore:
    'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 px-1 text-[11px] font-semibold text-gray-600 dark:text-white/60',
  typeBadge:
    'inline-flex max-w-full items-center gap-1 rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-[#164151]/80 dark:text-white/70 truncate',
  typeBadgeBoth:
    'inline-flex max-w-full items-center gap-1 rounded-full bg-cyan-500/12 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-400 truncate',
  typeBadgeOnline:
    'inline-flex max-w-full items-center gap-1 rounded-full bg-cyan-500/12 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-400 truncate',
  /** Iconos al inicio de la col. para quedar junto a Estado (sin hueco) */
  actionsCell:
    'inline-flex items-center justify-start gap-0 flex-nowrap whitespace-nowrap',
  actionsCellTh: 'text-left whitespace-nowrap',
  rowInactive: 'opacity-55',
  mobileList: 'md:hidden divide-y divide-gray-100 dark:divide-white/[0.04]',
} as const;

/** Lista de pagos / facturas — misma densidad que Clientes y Planes */
export const gymPaymentsListStyles = {
  ...gymClientsListStyles,
  table: 'w-full min-w-[1080px]',
  tableWrap: 'hidden md:block overflow-x-auto',
  row: 'cursor-pointer transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.04]',
  rowVoided:
    'cursor-pointer transition-colors bg-red-50/70 hover:bg-red-50 dark:bg-red-500/[0.07] dark:hover:bg-red-500/[0.1]',
  invoiceId:
    'text-sm font-semibold tabular-nums text-[#164151] dark:text-white',
  invoiceIdVoided:
    'text-sm font-semibold tabular-nums text-red-700/80 line-through decoration-red-400/80 dark:text-red-400/90',
  amount:
    'text-sm font-bold tabular-nums text-[#164151] dark:text-white whitespace-nowrap',
  amountVoided:
    'text-sm font-bold tabular-nums text-red-700/70 line-through decoration-red-400/70 dark:text-red-400/80 whitespace-nowrap',
  methodBadge:
    'inline-flex items-center rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-[#164151]/80 dark:text-white/70',
  badgeActive:
    'inline-flex items-center rounded-full bg-[#85ea10]/15 px-2 py-0.5 text-[11px] font-semibold text-[#3f7d08] dark:text-[#85ea10]',
  badgeVoided:
    'inline-flex items-center gap-1 rounded-full bg-red-500/12 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400',
  downloadBtn:
    'inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-[#85ea10]/15 px-2.5 text-[11px] font-semibold text-[#164151] hover:bg-[#85ea10]/25 dark:text-[#85ea10] dark:hover:bg-[#85ea10]/20 transition-colors shrink-0',
  periodCell:
    'text-xs tabular-nums whitespace-nowrap text-[#164151]/80 dark:text-white/70',
  dateCell:
    'text-xs tabular-nums whitespace-nowrap text-[#164151] dark:text-white/85',
  mutedCell: 'text-[#164151]/45 dark:text-white/35',
} as const;

/** Detalle de factura — misma densidad que ficha cliente / lista de pagos */
export const gymPaymentDetailStyles = {
  ...gymPaymentsListStyles,
  page: 'w-full max-w-none space-y-5',
  voidBanner:
    'rounded-xl border border-red-200/90 bg-red-50/80 px-4 py-3 dark:border-red-500/25 dark:bg-red-500/[0.08]',
  voidTitle:
    'text-[11px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400',
  voidBody: 'mt-1 text-sm text-red-800/90 dark:text-red-200/90',
  panel:
    'rounded-xl border border-gray-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5',
  panelTitle:
    'mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40',
  totalValue:
    'text-2xl font-bold tabular-nums tracking-tight text-[#164151] dark:text-white sm:text-3xl',
  totalValueVoided:
    'text-2xl font-bold tabular-nums tracking-tight text-red-700/80 line-through decoration-red-400/70 dark:text-red-400/90 sm:text-3xl',
  planName:
    'text-lg font-semibold leading-tight text-[#164151] dark:text-white',
  metaLine: 'mt-2 text-sm text-[#164151]/70 dark:text-white/60',
  metaLabel: 'text-gray-500 dark:text-white/45',
  clientLink:
    'inline-flex items-center gap-1 text-base font-semibold text-[#164151] hover:text-[#85ea10] dark:text-white dark:hover:text-[#85ea10] transition-colors',
} as const;

/** Detalle de cliente admin — misma densidad tipográfica que detalle de planes */
export const gymUserDetailStyles = {
  ...gymPlanClientsStyles,
  page: 'w-full max-w-none space-y-6',
  clientHeader:
    'flex flex-col gap-3 pb-3 mb-4 border-b border-gray-200/70 dark:border-white/[0.08] lg:flex-row lg:items-center lg:justify-between lg:gap-4',
  clientIdentity: 'flex min-w-0 items-center gap-3',
  clientAvatar:
    'h-14 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-200 dark:ring-white/12',
  clientName:
    'text-lg font-semibold leading-tight text-[#164151] dark:text-white truncate',
  clientMeta:
    'mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#164151]/70 dark:text-white/65',
  clientMetaSep: 'text-gray-300 dark:text-white/20',
  clientAside: 'flex flex-col items-stretch gap-2 shrink-0 lg:items-end',
  clientNameRow: 'flex flex-wrap items-center gap-2 min-w-0',
  /** Resumen comercial: grilla uniforme (mismo tamaño en todos los campos) */
  summaryStrip:
    'mb-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 rounded-lg border border-gray-200/80 bg-gray-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]',
  summaryItem: 'min-w-0 flex flex-col gap-1',
  summaryLabel: 'text-sm font-medium text-gray-500 dark:text-white/45',
  summaryValue:
    'truncate text-sm font-medium tabular-nums text-[#164151] dark:text-white',
  toolbarBtn:
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-[#164151] transition-colors hover:bg-gray-50 dark:border-white/12 dark:bg-transparent dark:text-white dark:hover:bg-white/[0.06]',
  toolbarBtnPrimary:
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#164151] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a4d5f] disabled:opacity-50',
  toolbarBtnDanger:
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10',
  sectionStack: 'space-y-6 w-full min-w-0',
  invoiceLink:
    'inline-flex items-center gap-1 text-sm font-medium text-[#164151]/80 hover:text-[#85ea10] dark:text-white/70 dark:hover:text-[#85ea10] transition-colors',
  badgeRenew:
    'inline-flex items-center rounded-full bg-orange-500/12 px-2 py-0.5 text-[11px] font-semibold text-orange-800 dark:text-orange-400',
  badgeInactiveClient:
    'inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400',
  badgeScheduled:
    'inline-flex items-center rounded-full bg-cyan-500/12 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-400',
  badgeCancelled:
    'inline-flex items-center rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:text-white/55',
  badgeFinished:
    'inline-flex items-center rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400',
  actionsCell:
    'inline-flex items-center justify-start gap-0 flex-nowrap whitespace-nowrap',
  actionsCellTh: 'text-left whitespace-nowrap',
  whatsappAction:
    'inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#25D366] hover:bg-[#25D366]/10 transition-colors shrink-0',
} as const;

export const commandCenterStyles = {
  page: 'space-y-6',
  header: 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
  title: 'text-xl font-semibold text-[#164151] dark:text-white capitalize',
  subtitle: 'text-sm text-gray-500 dark:text-white/50 mt-0.5',
  headerActions: 'flex flex-wrap items-center gap-2',
  filterRow: 'flex flex-wrap items-center gap-2',
  filterChipOn:
    'inline-flex h-8 items-center rounded-lg bg-[#164151] px-3 text-sm font-semibold text-white dark:bg-[#85ea10] dark:text-[#164151]',
  filterChipOff:
    'inline-flex h-8 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-[#164151] transition-colors hover:bg-gray-50 dark:border-white/12 dark:bg-transparent dark:text-white dark:hover:bg-white/[0.06]',
  filterDateTrigger:
    'h-8 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-[#164151] dark:border-white/12 dark:bg-transparent dark:text-white',
  iconBtn:
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-[#164151]/70 transition-colors hover:bg-gray-50 dark:border-white/12 dark:text-white/70 dark:hover:bg-white/10',
  ghostBtn:
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-[#164151] transition-colors hover:bg-gray-50 dark:border-white/12 dark:bg-transparent dark:text-white dark:hover:bg-white/[0.06]',
  kpiGrid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4',
  kpiCard:
    'w-full text-left bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg transition-colors hover:border-[#164151]/20 dark:hover:border-white/30',
  kpiCardStatic:
    'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg',
  kpiTop: 'flex items-center gap-3 mb-3',
  kpiIcon: 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
  kpiLabel:
    'text-xs font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide',
  kpiHint: 'text-[10px] text-gray-500 dark:text-white/50',
  kpiValue:
    'text-2xl font-semibold tabular-nums text-[#164151] dark:text-white',
  kpiDelta: 'text-xs mt-1 tabular-nums',
  kpiDeltaUp: 'text-emerald-600 dark:text-emerald-400',
  kpiDeltaDown: 'text-red-600 dark:text-red-400',
  kpiDeltaFlat: 'text-gray-500 dark:text-white/45',
  chartsGrid: 'grid grid-cols-1 gap-4 xl:grid-cols-2',
  chartPanel:
    'flex flex-col min-h-0 h-[16rem] bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 shadow-lg overflow-hidden',
  chartBody: 'flex-1 min-h-0 px-2 pb-2',
  chartTooltip:
    'rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-white/10 dark:bg-gray-900',
  chartTooltipLabel: 'text-[11px] text-gray-500 dark:text-white/50',
  chartTooltipValue:
    'text-sm font-semibold tabular-nums text-[#164151] dark:text-white',
  split: 'grid grid-cols-1 gap-4 xl:grid-cols-3',
  secondaryGrid: 'grid grid-cols-1 gap-4 md:grid-cols-2',
  panel:
    'flex flex-col min-h-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 shadow-lg overflow-hidden',
  panelRenew:
    'flex flex-col min-h-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-amber-300/50 dark:border-amber-400/25 shadow-lg overflow-hidden',
  panelHeader: 'flex items-start justify-between gap-3 px-5 pt-4 pb-3 shrink-0',
  panelTitle:
    'text-sm font-semibold text-[#164151] dark:text-white uppercase tracking-wide',
  panelHint: 'text-xs text-gray-500 dark:text-white/50 mt-0.5',
  countBadge:
    'inline-flex min-w-7 h-7 items-center justify-center rounded-full bg-[#164151] px-2 text-xs font-bold tabular-nums text-white dark:bg-[#85ea10] dark:text-[#164151]',
  countBadgeWarn:
    'inline-flex min-w-7 h-7 items-center justify-center rounded-full bg-amber-500 px-2 text-xs font-bold tabular-nums text-white',
  countBadgeMuted:
    'inline-flex min-w-7 h-7 items-center justify-center rounded-full bg-gray-200 px-2 text-xs font-bold tabular-nums text-gray-600 dark:bg-white/10 dark:text-white/60',
  queueList:
    'flex-1 min-h-0 overflow-y-auto overscroll-contain pb-2 scrollbar-hide',
  queueCardHeight: 'h-[22rem]',
  daysBadge:
    'shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  sectionLabel:
    'px-5 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40',
  row: 'flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50/80 dark:hover:bg-white/[0.04] transition-colors',
  avatar:
    'w-9 h-9 rounded-full overflow-hidden shrink-0 ring-1 ring-gray-200/80 dark:ring-white/12',
  rowBody: 'min-w-0 flex-1',
  rowName: 'text-sm font-semibold text-[#164151] dark:text-white truncate',
  rowMeta: 'text-[11px] text-gray-500 dark:text-white/50 truncate',
  rowActions: 'flex items-center gap-1 shrink-0',
  empty: 'px-5 py-10 text-center text-sm text-gray-500 dark:text-white/50',
  cashLine: 'flex items-center justify-between gap-3 text-sm px-5 py-2',
  cashLabel: 'text-gray-500 dark:text-white/50',
  cashValue: 'font-semibold tabular-nums text-[#164151] dark:text-white',
  cashNet:
    'flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-200 dark:border-white/10',
  cashNetLabel: 'text-sm font-semibold text-[#164151] dark:text-white',
  cashNetValue: 'text-lg font-bold tabular-nums text-[#164151] dark:text-white',
  onlineRow:
    'mx-5 mb-5 mt-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-gray-100/80 dark:hover:bg-white/[0.07]',
  errorBox:
    'rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/70 dark:bg-red-500/10 p-6 text-center',
  skeleton:
    'animate-pulse rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 h-28',
} as const;
