import React from 'react';
/** Bloco estático com a mesma altura do gráfico, para não haver layout shift. */
export const ChartSkeleton: React.FC<{ className: string; label?: string }> = ({
  className,
  label = 'CARREGANDO GRÁFICO...',
}) => (
  <div
    role="status"
    className={`w-full flex items-center justify-center border-2 border-border border-dashed bg-muted/40 ${className}`}
  >
    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
  </div>
);
