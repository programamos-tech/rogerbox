'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { PasswordFieldProps } from './types';
import { className as styles } from './styles';

function PasswordField({
  label,
  value,
  onChange,
  disabled,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>

      <div className={styles.inputWrapper}>
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={styles.input}
        />

        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className={styles.eyeButton}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default PasswordField;
