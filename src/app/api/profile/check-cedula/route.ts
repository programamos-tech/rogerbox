import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET ?document_id=XXX
 * Indica si la cédula ya está asociada a una cuenta (gym_client_info con user_id).
 * Usado en onboarding para avisar al usuario en tiempo real.
 */
export async function GET(request: NextRequest) {
  try {
    const documentId = request.nextUrl.searchParams
      .get('document_id')
      ?.trim()
      .replace(/\D/g, '');

    if (!documentId || documentId.length < 7 || documentId.length > 12) {
      return NextResponse.json(
        { alreadyLinked: false, error: 'Cédula inválida' },
        { status: 400 },
      );
    }

    const { data: client, error } = await supabaseAdmin
      .from('gym_client_info')
      .select('id, user_id, email')
      .eq('document_id', documentId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { alreadyLinked: false, error: 'Error al verificar' },
        { status: 500 },
      );
    }

    const alreadyLinked = !!client?.user_id;
    let emailMasked: string | null = null;

    if (alreadyLinked && client?.user_id) {
      let email: string | null = client.email?.trim() || null;
      if (!email) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', client.user_id)
          .maybeSingle();
        email = profile?.email?.trim() || null;
      }
      if (email) {
        const [local, domain] = email.split('@');
        const show =
          local && domain ? `${local.slice(0, 2)}***@${domain}` : email;
        emailMasked = show;
      }
    }

    return NextResponse.json({ alreadyLinked, emailMasked });
  } catch {
    return NextResponse.json(
      { alreadyLinked: false, error: 'Error inesperado' },
      { status: 500 },
    );
  }
}
