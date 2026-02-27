import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * API para andres.st / backstage: listar las 2 microtiendas (Sede Física, En línea)
 * y usuarios (perfiles/admin). Protegida por header x-andres-api-key (ANDRES_API_KEY).
 */

const API_KEY_HEADER = 'x-andres-api-key'
const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get(API_KEY_HEADER)
    const expectedKey = process.env.ANDRES_API_KEY

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: storesRows, error: storesError } = await supabaseAdmin
      .from('stores')
      .select('id, name, logo_url')
      .eq('is_active', true)
      .order('id')

    if (storesError) {
      console.error('[andres/usuarios-tiendas] stores:', storesError)
      return NextResponse.json({ error: 'Error fetching stores' }, { status: 500 })
    }

    const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const baseClean = base.replace(/\/$/, '')
    const stores = (storesRows ?? []).map((s: { id: string; name: string; logo_url?: string | null }) => {
      let logo = s.logo_url?.trim() || null
      if (logo?.startsWith('/')) logo = `${baseClean}${logo}`
      else if (!logo?.startsWith('http')) logo = `${baseClean}/logo.png`
      return { id: s.id, name: s.name, logo_url: logo }
    })

    const { data: profilesRows } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name')
      .limit(50)
    const profiles = profilesRows ?? []
    const users = profiles.map((p: { id: string; email: string | null; name: string | null }) => ({
      id: p.id,
      name: p.name ?? 'Usuario',
      email: p.email ?? '',
      store_id: MAIN_STORE_ID,
      es_dueño: false,
    }))

    const app_logo_url = `${baseClean}/logo.png`

    return NextResponse.json(
      { stores, users, app_logo_url, main_store_id: MAIN_STORE_ID },
      { status: 200 }
    )
  } catch (error) {
    console.error('[andres/usuarios-tiendas]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
