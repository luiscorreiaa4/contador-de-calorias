import { Link, useLocation } from 'react-router';
import { isTabActive, type NavTab } from '../../navigation/nav-items';

interface SegmentedNavProps {
  tabs: NavTab[];
  ariaLabel: string;
  /**
   * `boxed`: barra segmentada cheia (nível principal).
   * `underline`: abas de texto sublinhadas, subordinadas a uma barra `boxed` acima.
   */
  variant?: 'boxed' | 'underline';
}

const linkBase =
  'flex min-h-11 min-w-0 items-center justify-center px-2 text-center text-xs uppercase tracking-wider leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset';

const linkVariants = {
  boxed: {
    base: 'border-2',
    active: 'border-edge bg-primary text-primary-foreground font-bold',
    inactive: 'border-transparent text-foreground font-medium hover:bg-secondary',
  },
  underline: {
    base: 'border-b-4 -mb-0.5',
    active: 'border-foreground text-foreground font-black',
    inactive: 'border-transparent text-muted-foreground font-bold hover:text-foreground',
  },
} as const;

/** Barra de abas única dos submenus (mobile e desktop): colunas iguais, sem rolagem horizontal. */
export function SegmentedNav({ tabs, ariaLabel, variant = 'boxed' }: SegmentedNavProps) {
  const { pathname } = useLocation();
  const styles = linkVariants[variant];

  return (
    <nav aria-label={ariaLabel} className="w-full">
      <div
        className={`grid w-full grid-flow-col auto-cols-fr ${
          variant === 'boxed' ? 'bg-card border-2 border-border' : 'border-b-2 border-border'
        }`}
      >
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className={`${linkBase} ${styles.base} ${active ? styles.active : styles.inactive}`}
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
