import { useRef } from 'react';
import { Link, matchPath, useLocation } from 'react-router';
import { Plus } from 'lucide-react';
import { useNewMealModal } from '../../context/NewMealModalContext';
import { BOTTOM_NAV_ITEMS, isDestinationActive } from '../../navigation/nav-items';
import { useHideOnScroll } from '../../navigation/useHideOnScroll';
import { isValidLocalDateString } from '../../utils/date';

const slotClass =
  'flex h-full w-full items-center justify-center text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset';

/** Barra de navegação inferior do mobile (abaixo de md): [DIÁRIO] [PROGRESSO] [+] [CONTA]. */
export function BottomNav() {
  const barRef = useRef<HTMLElement>(null);
  const hidden = useHideOnScroll(barRef);
  const { pathname } = useLocation();
  const { open } = useNewMealModal();
  const [diario, progresso, conta] = BOTTOM_NAV_ITEMS;

  // No Diário, o "+" registra na data em exibição; nas demais telas, hoje.
  const diaryDate = matchPath('/diario/:date', pathname)?.params.date;

  const renderDestination = (item: (typeof BOTTOM_NAV_ITEMS)[number]) => {
    const active = isDestinationActive(pathname, item);
    const Icon = active ? item.activeIcon : item.icon;
    return (
      <li key={item.id} className="min-w-0">
        <Link to={item.to} aria-label={item.shortLabel} aria-current={active ? 'page' : undefined} className={slotClass}>
          <Icon className="h-6 w-6" />
        </Link>
      </li>
    );
  };

  return (
    <nav
      ref={barRef}
      aria-label="Navegação inferior"
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 bg-background supports-[backdrop-filter]:bg-background/85 backdrop-blur-2xl backdrop-saturate-150 border-t border-border/40 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out ${
        hidden ? 'translate-y-full pointer-events-none' : 'translate-y-0'
      }`}
    >
      <ul className="grid h-14 grid-cols-4">
        {renderDestination(diario)}
        {renderDestination(progresso)}
        <li className="min-w-0">
          <button
            type="button"
            aria-label="Nova refeição"
            onClick={() => open(isValidLocalDateString(diaryDate) ? { date: diaryDate } : undefined)}
            className={slotClass}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-none border-2 border-foreground">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        </li>
        {renderDestination(conta)}
      </ul>
    </nav>
  );
}
