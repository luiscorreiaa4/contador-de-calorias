import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, Trash2, Loader2, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  error,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPassword('');
      setShowPassword(false);
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          onClose();
        }

        // Trap focus inside modal
        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement?.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement?.focus();
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
    }
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;
    onConfirm(password);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
        className="w-full max-w-md bg-card border-2 border-border shadow-hard overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b-2 border-border flex items-start justify-between bg-background">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-destructive text-destructive-foreground shrink-0 border-2 border-transparent">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="delete-modal-title"
                className="text-lg font-heading font-black text-foreground uppercase tracking-tight mb-1"
              >
                EXCLUIR CONTA
              </h2>
              <span className="text-[10px] font-bold text-destructive uppercase tracking-widest">AÇÃO IRREVERSÍVEL</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 border-2 border-border bg-background text-foreground hover:bg-secondary transition-colors disabled:opacity-50 focus:outline-none focus:border-ring"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p
            id="delete-modal-description"
            className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed"
          >
            TEM CERTEZA DE QUE DESEJA EXCLUIR SUA CONTA? SEUS DADOS E HISTÓRICO SERÃO <strong className="text-foreground">PERMANENTEMENTE APAGADOS</strong> E NÃO PODERÃO SER RECUPERADOS.
          </p>

          {/* Form with Password Input */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="delete-account-password"
                className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2"
              >
                DIGITE SUA SENHA PARA CONFIRMAR
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="delete-account-password"
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="SUA SENHA ATUAL"
                  className={`w-full pl-10 pr-12 py-2.5 bg-background border-2 rounded-none text-sm font-medium text-foreground outline-none transition-colors min-h-[48px] ${error ? 'border-destructive bg-destructive/10 text-destructive focus:border-destructive' : 'border-border hover:border-foreground/60 focus:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'}`}
                  disabled={isLoading}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'delete-password-error' : undefined}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && (
                <p
                  id="delete-password-error"
                  role="alert"
                  aria-live="polite"
                  className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive flex items-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-4 border-t-2 border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 font-black uppercase tracking-widest text-xs text-foreground bg-background border-2 border-border hover:bg-secondary transition-colors focus:outline-none focus:border-ring disabled:opacity-50"
              >
                CANCELAR
              </button>

              <button
                type="submit"
                disabled={!password.trim() || isLoading}
                className="w-full sm:w-auto px-8 py-3 bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-destructive/90 transition-colors focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>EXCLUINDO...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>EXCLUIR</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
