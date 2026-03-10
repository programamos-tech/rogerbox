'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import DashboardNavbar from '@/components/DashboardNavbar';
import SimpleLoading from '@/components/SimpleLoading';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { FeedPage } from '@/modules/feed';

export default function FeedRoute() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [apiNotifications, setApiNotifications] = useState<
    Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      link: string | null;
      post_id: string | null;
      read_at: string | null;
    }>
  >([]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'rogerbox_feed_last_visit_at',
        new Date().toISOString(),
      );
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => setApiNotifications(data.notifications ?? []))
      .catch(() => setApiNotifications([]));
  }, [user?.id]);

  const notifications = useMemo(() => {
    return apiNotifications
      .filter((n) => !n.read_at)
      .map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        action: () => {
          fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: n.id }),
          }).then(() => {
            setApiNotifications((prev) =>
              prev.map((x) =>
                x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x,
              ),
            );
          });
          router.push(n.link || '/feed');
        },
        actionText: 'Ver en el feed',
      }));
  }, [apiNotifications, router]);

  if (loading || !user) {
    return <SimpleLoading message="Cargando..." size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <DashboardNavbar notifications={notifications} />
      <FeedPage />
    </div>
  );
}
