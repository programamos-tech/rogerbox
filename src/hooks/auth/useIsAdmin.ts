import { useMemo } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { UserRole } from './enum';

export const useIsAdmin = () => {
  const { user } = useSupabaseAuth();
  const isAdmin = useMemo(() => {
    return user?.user_metadata.role === UserRole.ADMIN;
  }, [user]);

  return isAdmin;
};
