import type { GymClientInfo, GymPlan } from '@/types/gym';

export interface GymPlanOverviewMembership {
  id: string;
  user_id: string | null;
  client_info_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  client_info: GymClientInfo | null;
}

export interface GymPlanInactiveClientRow {
  client_info: GymClientInfo;
  last_end_date: string;
  membership_id: string;
}

export interface GymPlanOverviewResponse {
  plan: GymPlan;
  counts: {
    active_now: number;
    expired: number;
    cancelled: number;
    inactive_marked: number;
    total_memberships: number;
    unique_clients_ever: number;
  };
  active_memberships: GymPlanOverviewMembership[];
  expired_memberships: GymPlanOverviewMembership[];
  cancelled_memberships: GymPlanOverviewMembership[];
  inactive_clients: GymPlanInactiveClientRow[];
}

export interface CommandCenterQueuePerson {
  client_info_id: string;
  href: string;
  name: string;
  document_id: string;
  plan_name: string;
  date: string;
  days: number;
  whatsapp: string | null;
  amount?: number | null;
}

export interface CommandCenterBirthdayPerson {
  client_info_id: string;
  href: string;
  name: string;
  document_id: string;
  age: number;
  whatsapp: string | null;
}

export interface GymCommandCenterResponse {
  today: string;
  kpis: {
    active: { count: number; vs30d: number };
    endingSoon: { count: number; days: number };
    expired: { count: number };
    netToday: {
      amount: number;
      income: number;
      expenses: number;
      vsYesterdayPct: number | null;
    };
  };
  cash: {
    income: number;
    cash: number;
    transfer: number;
    mixed: number;
    expenses: number;
    net: number;
    invoiceCount: number;
    onlineIncome: number;
    onlineCount: number;
  };
  queue: {
    collect: CommandCenterQueuePerson[];
    renew: CommandCenterQueuePerson[];
    advances: CommandCenterQueuePerson[];
    birthdays: CommandCenterBirthdayPerson[];
    totals: {
      collect: number;
      renew: number;
      advances: number;
      birthdays: number;
    };
  };
}
