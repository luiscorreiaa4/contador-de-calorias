import { createContext, useContext } from 'react';
import type { Meal } from '../services/meal.service';

export interface OpenNewMealOptions {
  /** Data (YYYY-MM-DD) da refeição; padrão: hoje. */
  date?: string;
  /** Refeição existente a editar. */
  meal?: Meal | null;
}

export interface NewMealModalContextValue {
  open: (options?: OpenNewMealOptions) => void;
  close: () => void;
}

export const NewMealModalContext = createContext<NewMealModalContextValue | undefined>(undefined);

export function useNewMealModal(): NewMealModalContextValue {
  const context = useContext(NewMealModalContext);
  if (!context) throw new Error('useNewMealModal deve ser usado dentro de NewMealModalProvider');
  return context;
}
