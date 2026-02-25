'use client';

import { Suspense } from 'react';
import InvalidRecoveryLink from './components/invalidRecovery';
import ResetPasswordForm from './components/resetPasswordForm';
import { useRecoverySession } from './hooks/useRecoverySession';

function Content() {
  const valid = useRecoverySession();

  if (valid === null) return null;
  if (!valid) return <InvalidRecoveryLink />;

  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <Content />
    </Suspense>
  );
}
