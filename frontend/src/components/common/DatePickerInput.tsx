import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerInputProps {
  id: string;
  value: string; // formato DD/MM/AAAA
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  placeholder?: string;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  placeholder = 'DD/MM/AAAA',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value && value.length === 10) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const date = new Date(y, m, d);
        if (!isNaN(date.getTime())) return date;
      }
    }
    return new Date();
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;

    if (digits.length > 2 && digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }

    onChange(formatted);
  };

  const getNativeDateValue = (): string => {
    if (value && value.length === 10) {
      const [d, m, y] = value.split('/');
      if (d && m && y && y.length === 4) {
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    return '';
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      const [y, m, d] = val.split('-');
      onChange(`${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`);
    }
    setIsOpen(false);
  };

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const dStr = String(day).padStart(2, '0');
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const yStr = String(currentYear);
    onChange(`${dStr}/${mStr}/${yStr}`);
    setIsOpen(false);
  };

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const today = new Date();
  const isSelectedDay = (day: number) => {
    if (!value || value.length !== 10) return false;
    const [d, m, y] = value.split('/').map((v) => parseInt(v, 10));
    return d === day && m === currentMonth + 1 && y === currentYear;
  };

  const isFutureDay = (day: number) => {
    const candidate = new Date(currentYear, currentMonth, day);
    return candidate > today;
  };

  const handleCalendarToggle = () => {
    if (nativeInputRef.current && 'showPicker' in HTMLInputElement.prototype && window.innerWidth < 640) {
      try {
        nativeInputRef.current.showPicker();
        return;
      } catch {
        // fallback
      }
    }
    setIsOpen(!isOpen);
  };

  const inputBase =
    'w-full pl-10 pr-10 py-2.5 bg-background border-2 rounded-none text-sm font-black text-foreground uppercase placeholder:text-muted-foreground outline-none transition-colors min-h-[48px]';
  const inputNormal = 'border-border hover:border-primary/50 focus:border-primary focus:ring-0';
  const inputError = 'border-destructive bg-destructive/10 text-destructive focus:border-destructive';

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
          <CalendarIcon className="w-4 h-4" aria-hidden="true" />
        </div>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleInputChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputBase} ${error ? inputError : inputNormal}`}
        />

        <button
          type="button"
          onClick={handleCalendarToggle}
          aria-label="Abrir calendário"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
        >
          <CalendarIcon className="w-4 h-4" aria-hidden="true" />
        </button>

        <input
          ref={nativeInputRef}
          type="date"
          tabIndex={-1}
          value={getNativeDateValue()}
          onChange={handleNativeChange}
          className="sr-only pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Seletor de data"
          className="absolute z-50 mt-2 right-0 sm:left-0 bg-card border-2 border-border shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] p-4 w-72 rounded-none animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between mb-4 border-b-2 border-border pb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 border-2 border-transparent hover:border-border text-foreground transition-colors focus:outline-none"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-heading font-black text-foreground uppercase tracking-widest text-sm">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 border-2 border-transparent hover:border-border text-foreground transition-colors focus:outline-none"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center font-black text-[10px] text-muted-foreground tracking-widest mb-2">
            <span>D</span>
            <span>S</span>
            <span>T</span>
            <span>Q</span>
            <span>Q</span>
            <span>S</span>
            <span>S</span>
          </div>

          <div className="grid grid-cols-7 text-center gap-1">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }

              const selected = isSelectedDay(day);
              const disabled = isFutureDay(day);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 flex items-center justify-center font-black text-xs transition-colors rounded-none border-2 border-transparent focus:outline-none focus:border-primary ${
                    selected
                      ? 'bg-primary text-primary-foreground'
                      : disabled
                      ? 'text-muted-foreground opacity-30 cursor-not-allowed'
                      : 'text-foreground hover:bg-secondary hover:border-border'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
