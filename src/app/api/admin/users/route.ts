import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Verificar autenticación
    const { session } = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener usuarios registrados desde profiles (sin relaciones primero para evitar errores si las tablas no existen)
    const { data: registeredUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users from profiles:', usersError);
      // Si hay error, intentar devolver array vacío en lugar de fallar
      if (usersError.code === '42P01') {
        // Tabla no existe
        console.warn('Tabla profiles no existe aún');
        return NextResponse.json({ users: [] });
      }
      throw usersError;
    }

    // Enriquecer usuarios registrados con información adicional (si las tablas existen)
    const enrichedRegisteredUsers = await Promise.all(
      (registeredUsers || []).map(async (user: any) => {
        try {
          // Intentar obtener membresías físicas
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
                plan:gym_plans(name)
              `)
              .eq('user_id', user.id);
            
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
            // Tabla no existe aún o error, continuar sin membresías
            if (e.code !== '42P01') {
              console.warn('Error obteniendo membresías:', e.message);
            }
          }

          // Intentar obtener compras de cursos
          let coursePurchases: any[] = [];
          try {
            const { data: purchases, error: purchasesError } = await supabaseAdmin
              .from('course_purchases')
              .select(`
                id,
                is_active,
                course:courses(title)
              `)
              .eq('user_id', user.id);
            
            if (!purchasesError && purchases) {
              coursePurchases = purchases;
            }
          } catch (e: any) {
            // Tabla no existe o error, continuar sin compras
            if (e.code !== '42P01') {
              console.warn('Error obteniendo compras de cursos:', e.message);
            }
          }

          // Calcular total gastado desde órdenes
          let totalSpent = 0;
          try {
            const { data: orders, error: ordersError } = await supabaseAdmin
              .from('orders')
              .select('amount, status')
              .eq('user_id', user.id)
              .eq('status', 'approved');
            
            if (!ordersError && orders) {
              totalSpent = orders.reduce((sum: number, order: any) => sum + (order.amount || 0), 0);
            }
          } catch (e: any) {
            // Tabla no existe o error, continuar sin total
            if (e.code !== '42P01') {
              console.warn('Error calculando total gastado:', e.message);
            }
          }

          // Verificar si tiene membresía física activa
          const activeMembership = gymMemberships.find(
            (m: any) => m.status === 'active' && new Date(m.end_date) >= new Date()
          );
          
          // Verificar si tiene compras de cursos activas
          const activeCoursePurchases = coursePurchases.filter((p: any) => p.is_active) || [];
          
          // Verificar si es cliente físico (tiene membresías aunque estén vencidas)
          const hasGymMembership = gymMemberships.length > 0;
          
          // Verificar si es cliente online (tiene compras de cursos)
          const hasOnlinePurchase = activeCoursePurchases.length > 0;

          // Obtener is_inactive del cliente físico si existe
          let isInactive = false;
          let clientInfoId = null;
          if (hasGymMembership && gymMemberships.length > 0) {
            clientInfoId = gymMemberships[0].client_info_id;
            if (clientInfoId) {
              try {
                const { data: clientInfo } = await supabaseAdmin
                  .from('gym_client_info')
                  .select('is_inactive')
                  .eq('id', clientInfoId)
                  .single();
                isInactive = clientInfo?.is_inactive || false;
              } catch (e) {
                // Continuar sin is_inactive si hay error
              }
            }
          }

          return {
            ...user,
            gym_memberships: gymMemberships,
            course_purchases: coursePurchases,
            hasActiveGymMembership: !!activeMembership,
            activeGymMembership: activeMembership,
            activeCoursePurchases: activeCoursePurchases,
            hasGymMembership,
            hasOnlinePurchase,
            userType: hasGymMembership && hasOnlinePurchase 
              ? 'both' 
              : hasGymMembership 
              ? 'physical' 
              : hasOnlinePurchase 
              ? 'online' 
              : 'none',
            isRegistered: true,
            totalSpent,
            is_inactive: isInactive,
            client_info_id: clientInfoId,
          };
        } catch (e) {
          // Si hay error al enriquecer, devolver usuario básico
          console.warn('Error enriqueciendo usuario:', e);
          return {
            ...user,
            gym_memberships: [],
            course_purchases: [],
            hasActiveGymMembership: false,
            activeGymMembership: null,
            activeCoursePurchases: [],
            hasGymMembership: false,
            hasOnlinePurchase: false,
            userType: 'none',
            isRegistered: true,
          };
        }
      })
    );

    // Obtener clientes físicos no registrados (si la tabla existe)
    let unregisteredClients: any[] = [];
    try {
      const { data: clients, error: clientsError } = await supabaseAdmin
        .from('gym_client_info')
        .select('*')
        .is('user_id', null)
        .order('created_at', { ascending: false });

      if (clientsError) {
        // Si la tabla no existe, simplemente continuar sin clientes físicos
        if (clientsError.code === '42P01') {
          console.warn('Tabla gym_client_info no existe aún');
        } else {
          console.error('Error fetching unregistered clients:', clientsError);
        }
      } else if (clients) {
        // Enriquecer con membresías si existen
        unregisteredClients = await Promise.all(
          clients.map(async (client: any) => {
            let gymMemberships: any[] = [];
            try {
              const { data: memberships, error: membershipsError } = await supabaseAdmin
                .from('gym_memberships')
                .select(`
                  id,
                  status,
                  start_date,
                  end_date,
                  plan:gym_plans(name)
                `)
                .eq('client_info_id', client.id);
              
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
              // Tabla no existe aún o error, continuar sin membresías
              if (e.code !== '42P01') {
                console.warn('Error obteniendo membresías para cliente:', e.message);
              }
            }

            const activeMembership = gymMemberships.find(
              (m: any) => m.status === 'active' && new Date(m.end_date) >= new Date()
            );

            // Calcular total gastado para cliente físico
            let clientTotalSpent = 0;
            try {
              const { data: clientOrders, error: clientOrdersError } = await supabaseAdmin
                .from('orders')
                .select('amount, status')
                .eq('user_id', client.user_id || client.id)
                .eq('status', 'approved');
              
              if (!clientOrdersError && clientOrders) {
                clientTotalSpent = clientOrders.reduce((sum: number, order: any) => sum + (order.amount || 0), 0);
              }
            } catch (e: any) {
              // Ignorar errores
            }

            return {
              id: client.id,
              name: client.name,
              email: client.email || null,
              phone: client.whatsapp,
              whatsapp: client.whatsapp,
              document_id: client.document_id,
              document_type: 'CC',
              weight: client.weight || null,
              birth_date: client.birth_date,
              created_at: client.created_at,
              gym_memberships: gymMemberships,
              hasActiveGymMembership: !!activeMembership,
              activeGymMembership: activeMembership,
              activeCoursePurchases: [],
              hasGymMembership: gymMemberships.length > 0,
              hasOnlinePurchase: false,
              userType: 'physical',
              isRegistered: false,
              isUnregisteredClient: true,
              totalSpent: clientTotalSpent,
              is_inactive: client.is_inactive || false,
            };
          })
        );
      }
    } catch (e) {
      // Tabla gym_client_info no existe aún, continuar sin clientes físicos
      console.warn('Tabla gym_client_info no disponible aún:', e);
    }

    // Combinar usuarios registrados y clientes físicos no registrados
    const allUsers = [...enrichedRegisteredUsers, ...unregisteredClients]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ users: allUsers });
  } catch (error: any) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios', details: error.message },
      { status: 500 }
    );
  }
}




