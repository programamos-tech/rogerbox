'use client';

import { useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export default function SignOutPage() {
  const { signOut } = useSupabaseAuth();

  useEffect(() => {
    signOut();
  }, [signOut]);

  return null;
}
