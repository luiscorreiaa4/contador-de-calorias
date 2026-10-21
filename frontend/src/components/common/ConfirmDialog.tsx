import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  const isLoadingRef = useRef(isLoading);

  useEffect(() => {
    onCancelRef.current = onCancel;
    isLoadingRef.current = isLoading;
  });

  // Foco inicial no botão de cancelar (ação segura) ao abrir
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Trap de foco e tratamento de Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoadingRef.current) {
        onCancelRef.current();
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first?.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDestructive = variant === 'destructive';
  const titleId = 'confirm-dialog-title';
  const descId = 'confirm-dialog-desc';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-md bg-card border-2 border-border shadow-hard overflow-hidden animate-in"
      >
        <div className="p-6 border-b-2 border-border bg-background flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 shrink-0 border-2 ${
                isDestructive
                  ? 'bg-destructive text-destructive-foreground border-transparent'
                  : 'bg-primary text-primary-foreground border-black shadow-hard-fill'
              }`}
            >
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-heading font-black text-foreground uppercase tracking-tight mb-1">
                {title}
              </h2>
              <div id={descId} className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                {description}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="p-1.5 border-2 border-border bg-background text-foreground hover:bg-secondary transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Fechar diálogo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 bg-background border-t-2 border-border">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 font-bold uppercase tracking-widest text-xs text-foreground bg-background border-2 border-border hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-2 font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-colors border-2 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 ${
              isDestructive
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent focus-visible:ring-destructive'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 border-black shadow-hard-fill focus-visible:ring-ring'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>Processando...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
