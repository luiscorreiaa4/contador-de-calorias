import { NavLink, Outlet } from 'react-router';

export interface SectionLink {
  to: string;
  label: string;
  shortLabel?: string;
}

interface SectionLayoutProps {
  title: string;
  description: string;
  links: SectionLink[];
}

export function SectionLayout({ title, description, links }: SectionLayoutProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-3">
        <h1 className="font-heading font-black text-3xl sm:text-5xl uppercase tracking-tighter">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <nav aria-label={title} className="w-full border-b-2 border-border pb-6">
        <div
          className={`w-full border-2 border-border bg-card p-1 shadow-hard gap-1 ${
            links.length === 2
              ? 'grid grid-cols-2 sm:inline-flex sm:w-auto'
              : links.length === 3
              ? 'grid grid-cols-3 sm:inline-flex sm:w-auto'
              : 'flex flex-wrap sm:inline-flex sm:w-auto'
          }`}
        >
          {links.map(({ to, label, shortLabel }) => (
            <NavLink
              key={to}
              to={to}
              aria-label={label}
              className={({ isActive }) =>
                `flex items-center justify-center text-center px-2 sm:px-6 py-3 text-xs font-black uppercase tracking-wider leading-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] min-w-0 ${
                  isActive
                    ? 'border-2 border-edge bg-primary text-primary-foreground font-bold shadow-hard-fill'
                    : 'border-2 border-transparent text-foreground hover:bg-secondary'
                }`
              }
            >
              {shortLabel ? (
                <>
                  <span className="sm:hidden truncate">{shortLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </>
              ) : (
                <span className="truncate">{label}</span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
