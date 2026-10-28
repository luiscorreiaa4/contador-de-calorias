import { Link, useLocation } from 'react-router';
import { isTabActive, type NavTab } from '../../navigation/nav-items';

interface SegmentedNavProps {
  tabs: NavTab[];
  ariaLabel: string;
}

/** Barra segmentada única dos submenus (mobile e desktop): colunas iguais, sem rolagem horizontal. */
export function SegmentedNav({ tabs, ariaLabel }: SegmentedNavProps) {
  const { pathname } = useLocation();

  return (
    <nav aria-label={ariaLabel} className="w-full">
      <div className="grid w-full grid-flow-col auto-cols-fr bg-card border-2 border-border">
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 min-w-0 items-center justify-center border-2 px-2 text-center text-xs uppercase tracking-wider leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                active
                  ? 'border-edge bg-primary text-primary-foreground font-bold'
                  : 'border-transparent text-foreground font-medium hover:bg-secondary'
              }`}
            >
              {tab.shortLabel ? (
                <>
                  <span className="min-w-0 truncate sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden min-w-0 truncate sm:inline">{tab.label}</span>
                </>
              ) : (
                <span className="min-w-0 truncate">{tab.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
