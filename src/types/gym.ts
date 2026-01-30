/**
 * Tipos TypeScript para el módulo de planes físicos (gimnasio)
 */

export type GymPlanStatus = 'active' | 'inactive';
export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'courtesy';
export type PaymentMethod = 'cash' | 'transfer' | 'mixed';
export type OrderType = 'course' | 'gym_plan';

export interface GymPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  active_users_count?: number; // Número de membresías activas
}

export interface GymPlanInsert {
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  is_active?: boolean;
  created_by?: string;
}

export interface GymPlanUpdate {
  name?: string;
  description?: string;
  price?: number;
  duration_days?: number;
  is_active?: boolean;
  updated_at?: string;
}

export interface GymClientInfo {
  id: string;
  user_id?: string | null;
  document_id: string;
  name: string;
  email?: string;
  whatsapp: string;
  birth_date?: string | null;
  weight?: number | null;
  medical_restrictions?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GymClientInfoInsert {
  document_id: string;
  name: string;
  email?: string;
  whatsapp: string;
  birth_date?: string;
  weight?: number;
  medical_restrictions?: string;
}

export interface GymClientInfoUpdate {
  name?: string;
  email?: string;
  whatsapp?: string;
  birth_date?: string;
  weight?: number;
  medical_restrictions?: string;
  user_id?: string | null;
  updated_at?: string;
}

export interface GymMembership {
  id: string;
  user_id?: string | null;
  client_info_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Relaciones
  client_info?: GymClientInfo;
  plan?: GymPlan;
  user?: {
    id: string;
    email?: string;
  };
}

export interface GymMembershipInsert {
  user_id?: string | null;
  client_info_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status?: MembershipStatus;
  created_by?: string;
}

export interface GymMembershipUpdate {
  user_id?: string | null;
  plan_id?: string;
  start_date?: string;
  end_date?: string;
  status?: MembershipStatus;
  updated_at?: string;
}

export interface GymPayment {
  id: string;
  membership_id: string;
  user_id?: string | null;
  client_info_id: string;
  plan_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  period_start: string;
  period_end: string;
  invoice_required: boolean;
  invoice_number?: string | null;
  invoice_pdf_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Relaciones
  membership?: GymMembership;
  client_info?: GymClientInfo;
  plan?: GymPlan;
  user?: {
    id: string;
    email?: string;
  };
}

export interface GymPaymentInsert {
  membership_id: string;
  user_id?: string | null;
  client_info_id: string;
  plan_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  period_start: string;
  period_end: string;
  invoice_required?: boolean;
  invoice_number?: string;
  invoice_pdf_url?: string;
  notes?: string;
  created_by?: string;
}

export interface GymPaymentUpdate {
  amount?: number;
  payment_method?: PaymentMethod;
  payment_date?: string;
  period_start?: string;
  period_end?: string;
  invoice_required?: boolean;
  invoice_number?: string;
  invoice_pdf_url?: string;
  notes?: string;
  updated_at?: string;
}

// Vista de cobranza (deudores)
export interface CollectionItem {
  membership_id: string;
  client_info_id: string;
  user_id?: string | null;
  client_name: string;
  document_id: string;
  whatsapp: string;
  email?: string;
  plan_name: string;
  plan_price: number;
  membership_start_date: string;
  membership_end_date: string;
  days_overdue: number;
  status: MembershipStatus;
  last_payment_date?: string | null;
  last_payment_amount?: number | null;
}

// Estadísticas
export interface GymStats {
  total_plans: number;
  active_plans: number;
  total_clients: number;
  registered_clients: number;
  unregistered_clients: number;
  active_memberships: number;
  expired_memberships: number;
  total_revenue: number;
  revenue_this_month: number;
  overdue_count: number;
}
