import type { ElementType, ReactNode } from 'react';

interface SectionCardProps {
  title?: ReactNode;
  titleAs?: ElementType;
  /** Slot à direita do título (ex.: SegmentedToggle do filtro que afeta o card). */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Casca padrão dos cartões de conteúdo das telas de Progresso: título + ações no cabeçalho. */
export function SectionCard({ title, titleAs: Title = 'h2', actions, className = '', children }: SectionCardProps) {
  return (
    <section className={`bg-card border-2 border-border shadow-hard p-4 sm:p-6 space-y-4 ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b-2 border-border pb-3">
          {title ? (
            <Title className="min-w-0 truncate text-xs sm:text-sm font-black uppercase tracking-widest text-foreground">{title}</Title>
          ) : (
            <span />
          )}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
