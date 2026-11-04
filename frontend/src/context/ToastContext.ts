import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error';

export type ShowToast = (message: string, type?: ToastType) => void;

// Sem provider (ex.: testes de componente isolado) o toast é ignorado.
export const ToastContext = createContext<ShowToast>(() => {});

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
