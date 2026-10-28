import { Outlet } from 'react-router';
import type { NavTab } from '../../navigation/nav-items';
import { SegmentedNav } from './SegmentedNav';

interface SectionLayoutProps {
  title: string;
  description: string;
  links: NavTab[];
  /** Rótulo acessível da barra de abas; por padrão, o título. */
  navLabel?: string;
  /** Nível superior opcional (ex.: Evolução | Metas dentro de Progresso); `links` vira o nível 2, sublinhado. */
  parentTabs?: NavTab[];
  parentLabel?: string;
}

export function SectionLayout({ title, description, links, navLabel, parentTabs, parentLabel }: SectionLayoutProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading font-black text-2xl sm:text-4xl uppercase tracking-tighter">{title}</h1>
        <p className="hidden sm:block text-muted-foreground">{description}</p>
      </div>
      <div className="w-full space-y-4">
        {parentTabs && <SegmentedNav tabs={parentTabs} ariaLabel={parentLabel ?? title} />}
        <SegmentedNav tabs={links} ariaLabel={navLabel ?? title} variant={parentTabs ? 'underline' : 'boxed'} />
      </div>
      <Outlet />
    </div>
  );
}
