import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage('Error enviando el correo.');
    } else {
      setMessage('Revisa tu correo para continuar.');
    }

    setLoading(false);
  };

  return {
    email,
    setEmail,
    message,
    loading,
    handleSend,
  };
}
