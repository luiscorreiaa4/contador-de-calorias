import type { QueryClient } from '@tanstack/react-query';
import { getActiveGoal } from '../services/goals.service';
import { getMealStats, getTodayMeals } from '../services/meal.service';
import { getMeasurements } from '../services/measurement.service';
import { getLocalDateString } from '../utils/date';
import type { NavDestination } from './nav-items';

const STALE_MS = 1000 * 60 * 5;

/**
 * Aquece o cache com as consultas principais do destino (mesmas chaves das telas).
 * Fonte única das chaves de prefetch; erros são ignorados: a tela refaz a consulta.
 */
export function prefetchFor(queryClient: QueryClient, id: NavDestination['id']): void {
  const today = getLocalDateString();
  const run = (queryKey: unknown[], queryFn: () => Promise<unknown>) =>
    void queryClient.prefetchQuery({ queryKey, queryFn, staleTime: STALE_MS });

  if (id === 'diario') {
    run(['todayMeals', today], () => getTodayMeals(today));
    run(['active-goal', today], () => getActiveGoal(today));
  } else if (id === 'historico') {
    run(['mealStats', 'week', today], () => getMealStats('week', today));
    run(['measurements', 'all'], () => getMeasurements('all'));
  }
}
