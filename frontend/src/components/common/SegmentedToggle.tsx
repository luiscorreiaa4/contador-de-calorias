interface ToggleOption<T extends string> {
  value: T;
  label: string;
  /** Nome acessível quando o rótulo visível é abreviado (ex.: "7D"). */
  ariaLabel?: string;
}

interface SegmentedToggleProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/** Chips compactos de filtro/modo: ficam junto do conteúdo que afetam (cabeçalho do card), nunca como barra de navegação. */
export function SegmentedToggle<T extends string>({ options, value, onChange, ariaLabel, className = '' }: SegmentedToggleProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className={`inline-flex shrink-0 gap-0.5 border-2 border-border bg-card p-0.5 ${className}`}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.ariaLabel}
            onClick={() => onChange(option.value)}
            className={`min-h-9 min-w-0 border-2 px-3 text-xs font-black uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
              active ? 'border-edge bg-primary text-primary-foreground' : 'border-transparent text-foreground hover:bg-secondary'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
