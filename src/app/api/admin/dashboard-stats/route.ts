import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { session } = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Ejecutar todas las consultas en paralelo para optimizar
    const [
      profilesResult,
      coursesResult,
      ordersResult,
      blogsResult,
      complementsResult,
      bannersResult,
      recentUsersResult,
      recentSalesResult,
    ] = await Promise.all([
      // Todos los perfiles con fecha de creación
      supabaseAdmin.from('profiles').select('id, created_at, goals'),
      // Todos los cursos
      supabaseAdmin.from('courses').select('id, title, is_published, students_count, created_at'),
      // Todas las órdenes
      supabaseAdmin.from('orders').select('id, amount, status, created_at, course_id'),
      // Blogs
      supabaseAdmin.from('nutritional_blogs').select('id, is_published'),
      // Complementos semanales
      supabaseAdmin.from('weekly_complements').select('id, is_published'),
      // Banners
      supabaseAdmin.from('banners').select('id, is_active'),
      // Usuarios recientes (últimos 5)
      supabaseAdmin.from('profiles').select('id, name, email, created_at').order('created_at', { ascending: false }).limit(5),
      // Ventas recientes (últimos 5)
      supabaseAdmin.from('orders').select('id, customer_name, customer_email, amount, status, created_at, course:courses(title)').order('created_at', { ascending: false }).limit(5),
    ]);

    const profiles = profilesResult.data || [];
    const courses = coursesResult.data || [];
    const orders = ordersResult.data || [];
    const blogs = blogsResult.data || [];
    const complements = complementsResult.data || [];
    const banners = bannersResult.data || [];

    // Calcular estadísticas de usuarios
    const totalUsers = profiles.length;
    const usersThisMonth = profiles.filter(p => new Date(p.created_at) >= startOfMonth).length;
    
    // Usuarios por día (últimos 7 días)
    const usersByDay: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = profiles.filter(p => p.created_at.startsWith(dateStr)).length;
      usersByDay.push({
        date: date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
        count
      });
    }

    // Calcular estadísticas de ventas
    const approvedOrders = orders.filter(o => o.status === 'approved' || o.status === 'APPROVED');
    const totalRevenue = approvedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const revenueThisMonth = approvedOrders
      .filter(o => new Date(o.created_at) >= startOfMonth)
      .reduce((sum, o) => sum + (o.amount || 0), 0);

    // Ventas por día (últimos 7 días)
    const salesByDay: { date: string; amount: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const daySales = approvedOrders.filter(o => o.created_at.startsWith(dateStr));
      salesByDay.push({
        date: date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
        amount: daySales.reduce((sum, o) => sum + (o.amount || 0), 0),
        count: daySales.length
      });
    }

    // Top cursos por estudiantes
    const topCourses = courses
      .filter(c => c.is_published)
      .sort((a, b) => (b.students_count || 0) - (a.students_count || 0))
      .slice(0, 5)
      .map(c => ({ id: c.id, title: c.title, students: c.students_count || 0 }));

    // Distribución de metas de usuarios
    const goalsCount: Record<string, number> = {};
    profiles.forEach(p => {
      if (p.goals) {
        try {
          const goals = typeof p.goals === 'string' ? JSON.parse(p.goals) : p.goals;
          if (Array.isArray(goals)) {
            goals.forEach((g: string) => {
              goalsCount[g] = (goalsCount[g] || 0) + 1;
            });
          }
        } catch {
          // Ignorar errores de parsing
        }
      }
    });

    const goalsDistribution = Object.entries(goalsCount)
      .map(([goal, count]) => ({ goal, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Estado del contenido
    const contentStatus = {
      courses: {
        total: courses.length,
        published: courses.filter(c => c.is_published).length,
      },
      blogs: {
        total: blogs.length,
        published: blogs.filter(b => b.is_published).length,
      },
      complements: {
        total: complements.length,
        published: complements.filter(c => c.is_published).length,
      },
      banners: {
        total: banners.length,
        active: banners.filter(b => b.is_active).length,
      },
    };

    // Formatear usuarios recientes
    const recentUsers = (recentUsersResult.data || []).map(u => ({
      id: u.id,
      name: u.name || 'Sin nombre',
      email: u.email,
      created_at: u.created_at
    }));

    // Formatear ventas recientes
    const recentSales = (recentSalesResult.data || []).map(s => ({
      id: s.id,
      customer_name: s.customer_name || 'Sin nombre',
      customer_email: s.customer_email,
      amount: s.amount,
      status: s.status,
      created_at: s.created_at,
      course_title: (s.course as any)?.title || 'Curso eliminado'
    }));

    return NextResponse.json({
      kpis: {
        totalUsers,
        usersThisMonth,
        totalCourses: courses.length,
        activeCourses: courses.filter(c => c.is_published).length,
        totalSales: approvedOrders.length,
        salesThisMonth: approvedOrders.filter(o => new Date(o.created_at) >= startOfMonth).length,
        totalRevenue,
        revenueThisMonth,
      },
      charts: {
        usersByDay,
        salesByDay,
      },
      topCourses,
      goalsDistribution,
      contentStatus,
      recentUsers,
      recentSales,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}



