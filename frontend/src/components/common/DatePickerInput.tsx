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

  // Fecha o popover ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Máscara automática DD/MM/AAAA
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

  // Converte DD/MM/AAAA para YYYY-MM-DD (para o input date nativo)
  const getNativeDateValue = (): string => {
    if (value && value.length === 10) {
      const [d, m, y] = value.split('/');
      if (d && m && y && y.length === 4) {
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    return '';
  };

  // Quando o input date nativo muda (mobile)
  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      const [y, m, d] = val.split('-');
      onChange(`${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`);
    }
    setIsOpen(false);
  };

  // Lógica do Calendário Popover
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
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

  // Dias do mês
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
    // Se estiver em mobile/touch e o browser suportar showPicker
    if (nativeInputRef.current && 'showPicker' in HTMLInputElement.prototype && window.innerWidth < 640) {
      try {
        nativeInputRef.current.showPicker();
        return;
      } catch (err) {
        // fallback para o popover visual caso showPicker falhe
      }
    }
    setIsOpen(!isOpen);
  };

  const inputBase =
    'w-full pl-9 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition-colors duration-150 min-h-[42px]';
  const inputNormal =
    'border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none';
  const inputError =
    'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20 focus:ring-2 focus:ring-red-400/20 outline-none';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Campo de Texto Principal */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
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

        {/* Botão do Calendário */}
        <button
          type="button"
          onClick={handleCalendarToggle}
          aria-label="Abrir calendário"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <CalendarIcon className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Input Nativo Invisível para Mobile */}
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

      {/* Popover de Calendário Desktop */}
      {isOpen && (
        <div className="absolute z-50 mt-1 right-0 sm:left-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-3 text-xs w-64 animate-in">
          {/* Header do Mês/Ano */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 text-center font-medium text-zinc-400 dark:text-zinc-500 mb-1">
            <span>D</span>
            <span>S</span>
            <span>T</span>
            <span>Q</span>
            <span>Q</span>
            <span>S</span>
            <span>S</span>
          </div>

          {/* Grid de Dias */}
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
                  className={`h-7 w-7 rounded-lg flex items-center justify-center font-medium transition-colors ${
                    selected
                      ? 'bg-indigo-600 text-white font-bold'
                      : disabled
                      ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50'
                      : 'text-zinc-700 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400'
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
