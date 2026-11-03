import React, { useState } from 'react';
import { OtpInput } from '../common/OtpInput';
import { Input } from '../ui/input';

interface MfaCodeFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

const labelClass = 'block text-xs font-bold uppercase tracking-widest text-muted-foreground';

/** Código do app autenticador (6 dígitos) ou, alternando, um código de recuperação (10 caracteres). */
export const MfaCodeField: React.FC<MfaCodeFieldProps> = ({ id, value, onChange, autoFocus }) => {
  const [recovery, setRecovery] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className={labelClass}>
        {recovery ? 'Código de recuperação' : 'Código do app autenticador'}
      </label>
      {recovery ? (
        <Input
          id={id}
          autoComplete="off"
          autoFocus
          maxLength={20}
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder="EX: 3F9A1C7B2E"
          className="font-mono uppercase tracking-widest max-w-xs"
        />
      ) : (
        <OtpInput id={id} value={value} onChange={onChange} autoFocus={autoFocus} />
      )}
      <button
        type="button"
        onClick={() => {
          setRecovery(!recovery);
          onChange('');
        }}
        className="text-[11px] font-bold uppercase tracking-widest text-primary-ink underline underline-offset-2 hover:text-primary-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {recovery
          ? 'Usar código do app autenticador'
          : 'Perdeu o celular? Usar código de recuperação'}
      </button>
    </div>
  );
};
