import { NavLink, Outlet } from 'react-router';

interface SectionLayoutProps {
  title: string;
  description: string;
  links: { to: string; label: string }[];
}

export function SectionLayout({ title, description, links }: SectionLayoutProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-3">
        <h1 className="font-heading font-black text-3xl sm:text-5xl uppercase tracking-tighter">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <nav aria-label={title} className="flex flex-wrap gap-2 border-b-2 border-border pb-4">
        {links.map(({ to, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `border-2 px-4 py-3 text-xs font-black uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-secondary'}`}>
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
