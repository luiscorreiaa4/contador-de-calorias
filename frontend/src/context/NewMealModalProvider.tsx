import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { getLocalDateString } from '../utils/date';
import type { Meal } from '../services/meal.service';
import { NewMealModalContext, type OpenNewMealOptions } from './NewMealModalContext';

const NewMealModal = lazy(() =>
  import('../components/meals/NewMealModal').then((m) => ({
    default: m.NewMealModal,
  }))
);

interface ModalState {
  isOpen: boolean;
  date: string;
  meal: Meal | null;
}

/** Host único do modal de Nova Refeição: qualquer tela abre por `useNewMealModal().open(...)`. */
export const NewMealModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ModalState>({ isOpen: false, date: '', meal: null });

  const open = useCallback((options: OpenNewMealOptions = {}) => {
    setState({ isOpen: true, date: options.date ?? getLocalDateString(), meal: options.meal ?? null });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, meal: null }));
  }, []);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <NewMealModalContext.Provider value={value}>
      {children}
      {state.isOpen && (
        <Suspense fallback={null}>
          <NewMealModal isOpen={state.isOpen} onClose={close} mealToEdit={state.meal} mealDate={state.date} />
        </Suspense>
      )}
    </NewMealModalContext.Provider>
  );
};
