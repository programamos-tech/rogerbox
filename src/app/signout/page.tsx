'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import SimpleLoading from '@/components/SimpleLoading';

export default function SignOutPage() {
  const router = useRouter();
  const { signOut } = useSupabaseAuth();

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut();
      // La redirección se maneja en el hook
    };

    handleSignOut();
  }, [signOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <SimpleLoading message="Cerrando sesión..." size="lg" />
    </div>
  );
}
