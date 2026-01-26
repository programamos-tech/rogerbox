import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

// GET - Obtener un usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session } = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Intentar obtener desde profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!profileError && profile) {
      // Enriquecer con membresías y pagos
      let gymMemberships: any[] = [];
      try {
        const { data: memberships, error: membershipsError } = await supabaseAdmin
          .from('gym_memberships')
          .select(`
            id,
            status,
            start_date,
            end_date,
            client_info_id,
            plan:gym_plans(name, id)
          `)
          .eq('user_id', id);
        
        if (!membershipsError && memberships) {
          // Obtener pagos relacionados para cada membresía
          const membershipIds = memberships.map((m: any) => m.id);
          let paymentsMap: Record<string, any> = {};
          
          if (membershipIds.length > 0) {
            try {
              const { data: payments, error: paymentsError } = await supabaseAdmin
                .from('gym_payments')
                .select('membership_id, invoice_number, payment_date, amount')
                .in('membership_id', membershipIds)
                .order('payment_date', { ascending: false });
              
              if (!paymentsError && payments) {
                // Crear mapa de pagos por membresía (tomar el más reciente de cada una)
                payments.forEach((payment: any) => {
                  if (!paymentsMap[payment.membership_id]) {
                    paymentsMap[payment.membership_id] = payment;
                  }
                });
              }
            } catch (e: any) {
              // Continuar sin pagos si hay error
            }
          }
          
          // Agregar información del pago a cada membresía
          gymMemberships = memberships.map((membership: any) => ({
            ...membership,
            payment: paymentsMap[membership.id] || null,
          }));
        }
      } catch (e: any) {
        // Continuar sin membresías si hay error
      }

      // Obtener compras de cursos
      let coursePurchases: any[] = [];
      try {
        const { data: purchases, error: purchasesError } = await supabaseAdmin
          .from('course_purchases')
          .select(`
            id,
            is_active,
            course:courses(title)
          `)
          .eq('user_id', id);
        
        if (!purchasesError && purchases) {
          coursePurchases = purchases;
        }
      } catch (e: any) {
        // Continuar sin compras
      }

      const activeCoursePurchases = coursePurchases.filter((p: any) => p.is_active) || [];
      const activeMembership = gymMemberships.find(
        (m: any) => m.status === 'active' && new Date(m.end_date) >= new Date()
      );

      // Obtener is_inactive del cliente físico si existe
      let isInactive = false;
      let clientInfoId = null;
      let medicalRestrictions = null;
      if (gymMemberships.length > 0) {
        clientInfoId = gymMemberships[0].client_info_id;
        if (clientInfoId) {
          try {
            const { data: clientInfo } = await supabaseAdmin
              .from('gym_client_info')
              .select('is_inactive, medical_restrictions')
              .eq('id', clientInfoId)
              .single();
            isInactive = clientInfo?.is_inactive || false;
            medicalRestrictions = clientInfo?.medical_restrictions || null;
          } catch (e) {
            // Continuar sin is_inactive si hay error
          }
        }
      }

      return NextResponse.json({ 
        user: {
          ...profile,
          gym_memberships: gymMemberships,
          course_purchases: coursePurchases,
          activeCoursePurchases: activeCoursePurchases,
          activeGymMembership: activeMembership,
          hasActiveGymMembership: !!activeMembership,
          is_inactive: isInactive,
          client_info_id: clientInfoId,
          medical_restrictions: medicalRestrictions || profile.medical_restrictions || null,
        }, 
        source: 'profile' 
      });
    }

    // Si no está en profiles, buscar en gym_client_info
    const { data: client, error: clientError } = await supabaseAdmin
      .from('gym_client_info')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!clientError && client) {
      // Enriquecer con membresías y pagos usando client_info_id (no user_id)
      let gymMemberships: any[] = [];
      try {
        const { data: memberships, error: membershipsError } = await supabaseAdmin
          .from('gym_memberships')
          .select(`
            id,
            status,
            start_date,
            end_date,
            client_info_id,
            plan:gym_plans(name, id)
          `)
          .eq('client_info_id', id);
        
        if (!membershipsError && memberships) {
          // Obtener pagos relacionados para cada membresía
          const membershipIds = memberships.map((m: any) => m.id);
          let paymentsMap: Record<string, any> = {};
          
          if (membershipIds.length > 0) {
            try {
              // Buscar pagos por membership_id (funciona con o sin user_id)
              const { data: payments, error: paymentsError } = await supabaseAdmin
                .from('gym_payments')
                .select('membership_id, invoice_number, payment_date, amount, user_id')
                .in('membership_id', membershipIds)
                .order('payment_date', { ascending: false });
              
              if (!paymentsError && payments) {
                // Crear mapa de pagos por membresía (tomar el más reciente de cada una)
                payments.forEach((payment: any) => {
                  if (!paymentsMap[payment.membership_id]) {
                    paymentsMap[payment.membership_id] = payment;
                  }
                });
              }
            } catch (e: any) {
              // Continuar sin pagos si hay error
            }
          }
          
          gymMemberships = memberships.map((membership: any) => ({
            ...membership,
            payment: paymentsMap[membership.id] || null,
          }));
        }
      } catch (e: any) {
        // Continuar sin membresías si hay error
      }

      const activeMembership = gymMemberships.find(
        (m: any) => m.status === 'active' && new Date(m.end_date) >= new Date()
      );

      // Si el cliente tiene user_id, obtener datos del perfil también
      let profileData: any = null;
      if (client.user_id) {
        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('height, gender, target_weight, goals, current_weight, weight_progress_percentage, streak_days, dietary_habits')
            .eq('id', client.user_id)
            .maybeSingle();
          if (profile) {
            profileData = profile;
          }
        } catch (e) {
          // Continuar sin datos del perfil si hay error
        }
      }

      return NextResponse.json({ 
        user: {
          id: client.id,
          name: client.name,
          email: client.email || null,
          phone: client.whatsapp,
          whatsapp: client.whatsapp,
          document_id: client.document_id,
          document_type: 'CC',
          weight: client.weight || profileData?.current_weight || profileData?.weight || null,
          current_weight: profileData?.current_weight || client.weight || null,
          height: profileData?.height || null,
          gender: profileData?.gender || null,
          target_weight: profileData?.target_weight || null,
          goals: profileData?.goals || null,
          weight_progress_percentage: profileData?.weight_progress_percentage || null,
          streak_days: profileData?.streak_days || null,
          dietary_habits: profileData?.dietary_habits || null,
          birth_date: client.birth_date,
          created_at: client.created_at,
          gym_memberships: gymMemberships,
          course_purchases: [],
          activeCoursePurchases: [],
          activeGymMembership: activeMembership,
          hasActiveGymMembership: !!activeMembership,
          hasGymMembership: gymMemberships.length > 0,
          hasOnlinePurchase: false,
          userType: 'physical',
          isRegistered: !!client.user_id,
          isUnregisteredClient: !client.user_id,
          is_inactive: client.is_inactive || false,
          client_info_id: client.id,
          medical_restrictions: client.medical_restrictions || null,
        }, 
        source: 'gym_client_info' 
      });
    }

    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  } catch (error: any) {
    console.error('Error in GET user:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuario', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session } = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Determinar si es un usuario registrado (profiles) o cliente físico (gym_client_info)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (profile) {
      // Actualizar perfil de usuario registrado
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (body.name !== undefined) {
        updateData.name = body.name.trim();
        updateData.full_name = body.name.trim(); // Compatibilidad
      }
      if (body.email !== undefined) updateData.email = body.email?.trim() || null;
      if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
      if (body.height !== undefined) updateData.height = body.height || null;
      if (body.weight !== undefined) updateData.weight = body.weight || null;
      if (body.current_weight !== undefined) updateData.current_weight = body.current_weight || null;
      if (body.gender !== undefined) updateData.gender = body.gender || null;
      if (body.target_weight !== undefined) updateData.target_weight = body.target_weight || null;
      if (body.goals !== undefined) {
        updateData.goals = Array.isArray(body.goals) 
          ? JSON.stringify(body.goals) 
          : (body.goals || '[]');
      }
      if (body.document_id !== undefined) updateData.document_id = body.document_id?.trim() || null;
      if (body.document_type !== undefined) updateData.document_type = body.document_type || null;
      if (body.address !== undefined) updateData.address = body.address?.trim() || null;
      if (body.city !== undefined) updateData.city = body.city?.trim() || null;
      if (body.birth_year !== undefined) updateData.birth_year = body.birth_year || null;
      if (body.medical_restrictions !== undefined) updateData.medical_restrictions = body.medical_restrictions?.trim() || null;

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
      }

      // Si se actualizó document_id, intentar vincular con cliente físico
      if (body.document_id && data) {
        const { data: clientInfo } = await supabaseAdmin
          .from('gym_client_info')
          .select('id')
          .eq('document_id', body.document_id)
          .is('user_id', null)
          .maybeSingle();

        if (clientInfo) {
          // Actualizar también medical_restrictions si se proporcionó
          const clientUpdateData: any = { user_id: id };
          if (body.medical_restrictions !== undefined) {
            clientUpdateData.medical_restrictions = body.medical_restrictions?.trim() || null;
          }
          
          await supabaseAdmin
            .from('gym_client_info')
            .update(clientUpdateData)
            .eq('id', clientInfo.id);

          await supabaseAdmin
            .from('gym_memberships')
            .update({ user_id: id })
            .eq('client_info_id', clientInfo.id)
            .is('user_id', null);

          await supabaseAdmin
            .from('gym_payments')
            .update({ user_id: id })
            .eq('client_info_id', clientInfo.id)
            .is('user_id', null);
        }
      }
      
      // Si el usuario tiene un client_info_id vinculado, también actualizar ahí
      if (body.medical_restrictions !== undefined && data) {
        const { data: linkedClient } = await supabaseAdmin
          .from('gym_client_info')
          .select('id')
          .eq('user_id', id)
          .maybeSingle();
          
        if (linkedClient) {
          await supabaseAdmin
            .from('gym_client_info')
            .update({ medical_restrictions: body.medical_restrictions?.trim() || null })
            .eq('id', linkedClient.id);
        }
      }

      return NextResponse.json(data);
    } else {
      // Actualizar cliente físico
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.email !== undefined) updateData.email = body.email?.trim() || null;
      if (body.whatsapp !== undefined) updateData.whatsapp = body.whatsapp.trim();
      if (body.birth_date !== undefined) updateData.birth_date = body.birth_date || null;
      if (body.weight !== undefined) updateData.weight = body.weight || null;
      if (body.medical_restrictions !== undefined) updateData.medical_restrictions = body.medical_restrictions?.trim() || null;

      const { data, error } = await supabaseAdmin
        .from('gym_client_info')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating gym client:', error);
        return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 });
      }

      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error('Error in PUT user:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario', details: error.message },
      { status: 500 }
    );
  }
}
