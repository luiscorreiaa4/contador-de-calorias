/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function formatNumberPtBr(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num);
}

export function getPaginationWindow(current: number, total: number): (number | 'ellipsis-start' | 'ellipsis-end')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: (number | 'ellipsis-start' | 'ellipsis-end')[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) {
    items.push('ellipsis-start');
  }

  for (let i = left; i <= right; i++) {
    items.push(i);
  }

  if (right < total - 1) {
    items.push('ellipsis-end');
  }

  items.push(total);
  return items;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const pageItems = getPaginationWindow(page, totalPages);

  return (
    <nav
      aria-label="Paginação"
      className="p-4 bg-background border-t-2 border-border flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs select-none"
    >
      {/* Indicador Numérico em pt-BR */}
      <div className="text-muted-foreground uppercase text-[11px] font-bold tracking-wider order-1">
        Mostrando <strong className="text-foreground">{formatNumberPtBr(start)}</strong>–
        <strong className="text-foreground">{formatNumberPtBr(end)}</strong> de{' '}
        <strong className="text-foreground">{formatNumberPtBr(total)}</strong> alimentos
      </div>

      {/* Controles de Navegação Desktop (>= 640px) */}
      <div className="hidden sm:flex items-center gap-1.5 order-2">
        {/* Primeira Página */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          aria-label="Primeira página"
          title="Primeira página"
          className="p-2 border-2 border-border bg-background text-foreground hover:bg-secondary disabled:opacity-35 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] min-w-[44px] flex items-center justify-center shadow-hard"
        >
          <ChevronsLeft className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Primeira página</span>
        </button>

        {/* Página Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          title="Página anterior"
          className="p-2 border-2 border-border bg-background text-foreground hover:bg-secondary disabled:opacity-35 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] min-w-[44px] flex items-center justify-center shadow-hard"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Página anterior</span>
        </button>

        {/* Números das Páginas com Reticências */}
        <div className="flex items-center gap-1 px-1">
          {pageItems.map((item, idx) => {
            if (typeof item !== 'number') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-muted-foreground font-black tracking-widest select-none"
                  aria-hidden="true"
                >
                  …
                </span>
              );
            }

            const isCurrent = item === page;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`Página ${item}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={`min-h-[44px] min-w-[44px] px-3 py-1.5 border-2 text-xs uppercase font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground border-edge shadow-hard-fill font-black'
                    : 'border-border bg-background text-foreground hover:bg-secondary shadow-hard'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Próxima Página */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Próxima página"
          title="Próxima página"
          className="p-2 border-2 border-border bg-background text-foreground hover:bg-secondary disabled:opacity-35 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] min-w-[44px] flex items-center justify-center shadow-hard"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Próxima página</span>
        </button>

        {/* Última Página */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          aria-label="Última página"
          title="Última página"
          className="p-2 border-2 border-border bg-background text-foreground hover:bg-secondary disabled:opacity-35 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] min-w-[44px] flex items-center justify-center shadow-hard"
        >
          <ChevronsRight className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Última página</span>
        </button>
      </div>

      {/* Versão Compacta Mobile (< 640px) */}
      <div className="flex sm:hidden items-center justify-between w-full gap-2 order-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior (mobile)"
          className="px-3 py-2 border-2 border-border bg-background text-foreground hover:bg-secondary disabled:opacity-35 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] flex items-center gap-1 font-bold shadow-hard"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <span className="font-mono text-xs font-bold uppercase text-foreground px-2">
          Página {page} de {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Próxima página (mobile)"
          className="px-3 py-2 border-2 border-border bg-background text-foreground hover:bg-secondary disabled:opacity-35 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] flex items-center gap-1 font-bold shadow-hard"
        >
          <span>Próxima</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Seletor de Itens por Página */}
      <div className="flex items-center gap-2 order-3 shrink-0">
        <label
          htmlFor="admin-pagination-page-size"
          className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
        >
          Exibir:
        </label>
        <select
          id="admin-pagination-page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Itens por página"
          className="px-2.5 py-1.5 text-xs font-mono uppercase bg-background border-2 border-border text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] cursor-pointer shadow-hard"
        >
          <option value={25}>25 / pág</option>
          <option value={50}>50 / pág</option>
          <option value={100}>100 / pág</option>
        </select>
      </div>
    </nav>
  );
};
