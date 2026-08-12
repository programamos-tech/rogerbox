'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/shared/components/ThemeProvider';
import { themeToggleStyles as styles } from '@/shared/components/themeToggle.styles';
import { THEME_OPTIONS, type ThemeMode } from '@/shared/constants/theme';

const ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

type ThemeToggleProps = {
  variant?: 'icon' | 'nav';
};

function ThemeToggleComponent({ variant = 'icon' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggleOpen = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const onSelect = useCallback(
    (mode: ThemeMode) => {
      setTheme(mode);
      setOpen(false);
    },
    [setTheme],
  );

  const CurrentIcon = ICONS[mounted ? theme : 'system'];
  const currentLabel =
    THEME_OPTIONS.find((option) => option.id === (mounted ? theme : 'system'))
      ?.label ?? 'Sistema';

  return (
    <div ref={rootRef} className="relative" data-theme-toggle>
      <button
        type="button"
        onClick={toggleOpen}
        className={`${styles.trigger} ${variant === 'nav' ? styles.triggerNav : styles.triggerIcon}`}
        aria-label={`Tema: ${currentLabel}. Cambiar tema`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Tema: claro, oscuro o sistema"
      >
        <CurrentIcon className={styles.triggerSvg} />
      </button>

      {open && (
        <div className={styles.menu} role="menu" aria-label="Elegir tema">
          {THEME_OPTIONS.map((option) => {
            const Icon = ICONS[option.id];
            const isActive = mounted && theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => onSelect(option.id)}
                className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
              >
                <Icon className={styles.itemIcon} />
                <span className={styles.itemCopy}>
                  <span className={styles.itemLabel}>{option.label}</span>
                  <span className={styles.itemDescription}>
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const ThemeToggle = memo(ThemeToggleComponent);
