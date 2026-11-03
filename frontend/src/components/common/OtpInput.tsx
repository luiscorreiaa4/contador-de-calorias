import React, { useState } from 'react';

const LENGTH = 6;

interface OtpInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  'aria-describedby'?: string;
}

/**
 * Código de 6 dígitos em quadros. Um único <input> real e transparente cobre os quadros:
 * colar, autofill de SMS/gerenciador de senhas, teclado numérico e leitores de tela
 * funcionam como num campo comum; os quadros são só visuais.
 */
export const OtpInput: React.FC<OtpInputProps> = ({
  id,
  value,
  onChange,
  invalid = false,
  disabled = false,
  autoFocus,
  'aria-describedby': describedBy,
}) => {
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, LENGTH - 1);

  return (
    <div className="relative w-full max-w-xs">
      <div aria-hidden="true" className="grid grid-cols-6 gap-2">
        {Array.from({ length: LENGTH }, (_, i) => {
          const isActive = focused && i === active;
          return (
            <div
              key={i}
              className={`flex h-14 items-center justify-center border-2 bg-background font-mono text-2xl font-black text-foreground transition-colors ${
                invalid
                  ? 'border-destructive'
                  : isActive
                    ? 'border-ring ring-2 ring-ring'
                    : value[i]
                      ? 'border-foreground'
                      : 'border-border'
              } ${disabled ? 'opacity-50' : ''}`}
            >
              {value[i] ??
                (isActive && (
                  <span className="h-7 w-0.5 bg-foreground animate-pulse motion-reduce:animate-none" />
                ))}
            </div>
          );
        })}
      </div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        // Sem maxLength: cortaria um código colado com espaços ("123 456") antes da limpeza.
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        // text-base evita o zoom automático do iOS em campos com fonte < 16px.
        className="absolute inset-0 h-full w-full cursor-text text-base opacity-0 disabled:cursor-not-allowed"
      />
    </div>
  );
};
