'use client';

import { useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  weight: number;
  height: number;
  gender: string;
  goals: string[];
  target_weight: number | null;
  membership_status: 'inactive' | 'active' | 'expired';
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      if (data) {
        // Parsear goals si es JSON string
        let goals = data.goals;
        if (typeof goals === 'string') {
          try {
            goals = JSON.parse(goals);
          } catch (e) {
            goals = [];
          }
        }

        setProfile({
          ...data,
          goals: goals || []
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error signing in with Google:', error);
      return { error };
    }

    return { error: null };
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔐 Intentando login con:', { email, url: supabase.supabaseUrl });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('❌ Error de Supabase Auth:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        setLoading(false);
        return { error };
      }

      console.log('✅ Login exitoso:', { userId: data.user?.id, email: data.user?.email });
      setLoading(false);
      return { data, error: null };
    } catch (err) {
      console.error('❌ Error inesperado en login:', err);
      setLoading(false);
      return { 
        error: { 
          message: err instanceof Error ? err.message : 'Error desconocido al iniciar sesión',
          name: 'AuthError'
        } 
      };
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    setLoading(false);

    if (error) {
      return { error };
    }

    return { data, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return { error };
    }
    
    setUser(null);
    setProfile(null);
    setSession(null);
    router.push('/');
    
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  return {
    user,
    profile,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
  };
}

// Hook simplificado solo para obtener el usuario
export function useUser() {
  const { user, profile, loading } = useSupabaseAuth();
  return { user, profile, loading };
}

