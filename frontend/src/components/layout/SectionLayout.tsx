import { Outlet } from 'react-router';
import type { NavTab } from '../../navigation/nav-items';
import { SegmentedNav } from './SegmentedNav';

export type SectionLink = NavTab;

interface SectionLayoutProps {
  title: string;
  description: string;
  links: NavTab[];
  /** Rótulo acessível da barra de abas; por padrão, o título. */
  navLabel?: string;
  /** Nível superior opcional (ex.: Evolução | Metas dentro de Progresso). */
  parentTabs?: NavTab[];
  parentLabel?: string;
}

export function SectionLayout({ title, description, links, navLabel, parentTabs, parentLabel }: SectionLayoutProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-3">
        <h1 className="font-heading font-black text-3xl sm:text-5xl uppercase tracking-tighter">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="w-full border-b-2 border-border pb-6 space-y-3">
        {parentTabs && <SegmentedNav tabs={parentTabs} ariaLabel={parentLabel ?? title} />}
        <SegmentedNav tabs={links} ariaLabel={navLabel ?? title} />
      </div>
      <Outlet />
    </div>
  );
}
