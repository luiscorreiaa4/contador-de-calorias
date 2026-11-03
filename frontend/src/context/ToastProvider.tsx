import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ToastContext, type ToastType } from './ToastContext';
import { EXIT_MS } from '../hooks/usePresence';
import { prefersReducedMotion } from '../navigation/swipe';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  leaving: boolean;
}

const VISIBLE_MS = 4000;

/** Fila de avisos curtos anunciados por leitor de tela (`role="status"` / `role="alert"`). */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId.current;
    setToasts((prev) => [...prev, { id, message, type, leaving: false }]);
    const exitMs = prefersReducedMotion() ? 0 : EXIT_MS;
    timers.current.push(
      window.setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      }, VISIBLE_MS),
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, VISIBLE_MS + exitMs),
    );
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 z-[300] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`w-full max-w-sm p-3 border-2 shadow-hard text-xs font-black uppercase tracking-widest ${
              toast.leaving ? 'animate-out' : 'animate-rise'
            } ${
              toast.type === 'error'
                ? 'border-destructive bg-destructive text-destructive-foreground'
                : 'border-border bg-card text-foreground'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
