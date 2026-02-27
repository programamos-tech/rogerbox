import { supabaseAdmin } from './supabase'

/** ID sede física (tienda física) */
export const STORE_ID_FISICA = '00000000-0000-0000-0000-000000000001'
/** ID en línea */
export const STORE_ID_ONLINE = '00000000-0000-0000-0000-000000000002'

export interface LogInsert {
  user_id?: string | null
  action: string
  module: string
  details?: Record<string, unknown>
  store_id?: string | null
}

/**
 * Registra una actividad en logs (para andres.st y sede física/en línea).
 */
export async function insertLog(entry: LogInsert): Promise<void> {
  try {
    await supabaseAdmin.from('logs').insert({
      user_id: entry.user_id ?? null,
      action: entry.action,
      module: entry.module,
      details: entry.details ?? {},
      store_id: entry.store_id ?? null,
    })
  } catch (e) {
    console.error('[logs-service] insertLog', e)
  }
}
