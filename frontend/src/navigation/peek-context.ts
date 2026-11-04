import { createContext, useContext } from 'react';
import type { NavDestination } from './nav-items';

/** Destino vizinho que o swipe está mostrando durante o arrasto (fica visível ao lado da tela atual). */
export const PeekContext = createContext<NavDestination['id'] | null>(null);
export const usePeek = () => useContext(PeekContext);
