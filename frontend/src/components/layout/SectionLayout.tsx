import { Outlet } from 'react-router';
import type { NavTab } from '../../navigation/nav-items';
import { SegmentedNav } from './SegmentedNav';

interface SectionLayoutProps {
  title: string;
  description: string;
  links: NavTab[];
}

export function SectionLayout({ title, description, links }: SectionLayoutProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading font-black text-2xl sm:text-4xl uppercase tracking-tighter">
          {title}
        </h1>
        <p className="hidden sm:block text-muted-foreground">{description}</p>
      </div>
      <SegmentedNav tabs={links} ariaLabel={title} />
      <Outlet />
    </div>
  );
}
