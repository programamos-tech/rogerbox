export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** Clave genérica (white-label): no depende del nombre del gym. */
export const THEME_STORAGE_KEY = 'app-theme';

export const THEME_OPTIONS = [
  {
    id: 'light' as const,
    label: 'Claro',
    description: 'Fondo claro',
  },
  {
    id: 'dark' as const,
    label: 'Oscuro',
    description: 'Fondo oscuro',
  },
  {
    id: 'system' as const,
    label: 'Sistema',
    description: 'Igual que tu PC',
  },
];
