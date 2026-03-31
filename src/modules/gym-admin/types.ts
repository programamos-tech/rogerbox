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
