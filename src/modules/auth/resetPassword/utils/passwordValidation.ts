export function validatePassword(password: string, confirm: string) {
  if (!password) return 'La contraseña es requerida';
  if (password.length < 8) return 'Debe tener al menos 8 caracteres';
  if (password !== confirm) return 'Las contraseñas no coinciden';
  return null;
}
