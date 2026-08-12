'use client';

import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Bell,
  Calendar,
  CheckCircle,
  X,
} from 'lucide-react';
import {
  allRenewalPlansDismissed,
  buildGymRenewalAdminContext,
  buildRenewalPlanMenuOptions,
  computeClientGymAdminStatus,
  renewalPendingPlanIdsFromMemberships,
  summarizeGymPlansPerClient,
} from '@/shared/utils/gym-membership-admin.util';

type BadgeSize = 'sm' | 'md';

interface GymClientPaymentStatusBadgeProps {
  memberships?: any[];
  activeCoursePurchases?: any[];
  isInactive?: boolean;
  renewalFollowupDismissedPlanIds?: string[] | null;
  size?: BadgeSize;
}

const sizeClasses: Record<
  BadgeSize,
  { base: string; compact: string; icon: string }
> = {
  sm: {
    base: 'text-[11px] px-2 py-0.5 rounded-full font-semibold',
    compact:
      'text-[11px] px-2 py-0.5 rounded-full font-semibold leading-tight max-w-[16rem]',
    icon: 'w-3 h-3 shrink-0',
  },
  md: {
    base: 'text-sm px-2.5 py-1 rounded-full font-semibold',
    compact:
      'text-sm px-2.5 py-1 rounded-full font-semibold leading-tight max-w-[18rem]',
    icon: 'w-3.5 h-3.5 shrink-0',
  },
};

export function GymClientPaymentStatusBadge({
  memberships = [],
  activeCoursePurchases = [],
  isInactive = false,
  renewalFollowupDismissedPlanIds,
  size = 'md',
}: GymClientPaymentStatusBadgeProps) {
  const classes = sizeClasses[size];

  if (isInactive) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${classes.base} bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400`}
      >
        <X className={classes.icon} />
        Inactivo
      </span>
    );
  }

  const courses = activeCoursePurchases || [];
  const nonCancelled = memberships.filter((m) => m.status !== 'cancelled');
  const summaries = summarizeGymPlansPerClient(memberships);
  const gymStatus = computeClientGymAdminStatus(summaries, memberships);
  const ctx = buildGymRenewalAdminContext(memberships);
  const renewalDismissed = allRenewalPlansDismissed(
    renewalPendingPlanIdsFromMemberships(ctx.expiredNeedingRenewal),
    renewalFollowupDismissedPlanIds,
  );

  if (nonCancelled.length === 0 && courses.length === 0) {
    if (memberships.some((m) => m.status === 'cancelled')) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 ${classes.base} bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400`}
        >
          <X className={classes.icon} />
          Cancelado
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${classes.base} bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60`}
      >
        <AlertCircle className={classes.icon} />
        Sin pagos
      </span>
    );
  }

  if (nonCancelled.length === 0 && courses.length > 0) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${classes.base} bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400`}
      >
        <CheckCircle className={classes.icon} />
        Al día
      </span>
    );
  }

  if (gymStatus === 'cancelled_only') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${classes.base} bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400`}
      >
        <X className={classes.icon} />
        Cancelado
      </span>
    );
  }

  if (gymStatus === 'all_current') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${classes.base} bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400`}
      >
        <CheckCircle className={classes.icon} />
        Al día
      </span>
    );
  }

  if (gymStatus === 'scheduled_only') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${classes.base} bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400`}
      >
        <Calendar className={classes.icon} />
        Programado
      </span>
    );
  }

  if (gymStatus === 'current_no_payment') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${classes.base} bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300`}
      >
        <AlertTriangle className={classes.icon} />
        Sin factura
      </span>
    );
  }

  const renewCount = buildRenewalPlanMenuOptions(
    ctx.expiredNeedingRenewal,
  ).length;
  const vigentesCount = summaries.filter(
    (s) => s.kind === 'current' || s.kind === 'scheduled',
  ).length;

  if (gymStatus === 'renewal') {
    if (renewalDismissed) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 ${classes.base} bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300`}
        >
          <Ban className={classes.icon} />
          Renovación descartada
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${classes.base} bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400`}
      >
        <AlertTriangle className={classes.icon} />
        {renewCount > 1 ? `${renewCount} por renovar` : 'Renovar'}
      </span>
    );
  }

  if (gymStatus === 'partial_renewal') {
    if (ctx.expiredNeedingRenewal.length === 0) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 ${classes.base} bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300`}
        >
          <AlertTriangle className={classes.icon} />
          Parcial
        </span>
      );
    }
    if (renewalDismissed) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 ${classes.base} bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300`}
        >
          <Ban className={classes.icon} />
          {vigentesCount > 0
            ? 'Activo · Renovación descartada'
            : 'Renovación descartada'}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${classes.base} bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300`}
      >
        <Bell className={classes.icon} />
        {vigentesCount > 0
          ? renewCount > 1
            ? `Activo · ${renewCount} por renovar`
            : 'Activo · Renovar'
          : renewCount > 1
            ? `${renewCount} por renovar`
            : 'Renovar'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${classes.base} bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60`}
    >
      <AlertCircle className={classes.icon} />
      Sin pagos
    </span>
  );
}
