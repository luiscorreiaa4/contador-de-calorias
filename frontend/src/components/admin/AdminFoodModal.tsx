import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Loader2, Database } from 'lucide-react';
import {
  calculateCaloricWarnings,
  type Food,
  type AdminCreateFoodDTO,
  type AdminUpdateFoodDTO,
} from '@caloriesync/shared';

interface AdminFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodToEdit?: Food | null;
  onSubmit: (data: AdminCreateFoodDTO | AdminUpdateFoodDTO) => Promise<void>;
  isLoading?: boolean;
}

interface AdminFoodFormInnerProps {
  onClose: () => void;
  foodToEdit?: Food | null;
  onSubmit: (data: AdminCreateFoodDTO | AdminUpdateFoodDTO) => Promise<void>;
  isLoading?: boolean;
}

const AdminFoodFormInner: React.FC<AdminFoodFormInnerProps> = ({
  onClose,
  foodToEdit,
  onSubmit,
  isLoading = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inicializa o estado diretamente dos props (padrão oficial React: reset via key)
  const [name, setName] = useState(foodToEdit?.name ?? '');
  const [calories, setCalories] = useState<number | ''>(foodToEdit ? Number(foodToEdit.calories) : '');
  const [proteins, setProteins] = useState<number | ''>(foodToEdit ? Number(foodToEdit.proteins) : '');
  const [carbs, setCarbs] = useState<number | ''>(foodToEdit ? Number(foodToEdit.carbs) : '');
  const [fats, setFats] = useState<number | ''>(foodToEdit ? Number(foodToEdit.fats) : '');
  const [baseUnit, setBaseUnit] = useState<'g' | 'ml'>((foodToEdit?.base_unit as 'g' | 'ml') || 'g');
  const [servingWeight, setServingWeight] = useState<number | ''>(
    foodToEdit ? Number(foodToEdit.serving_weight) || 100 : 100
  );
  const [unitName, setUnitName] = useState(foodToEdit?.unit_name || '');
  const [unitWeight, setUnitWeight] = useState<number | ''>(
    foodToEdit?.unit_weight ? Number(foodToEdit.unit_weight) : ''
  );
  const [sourceRef, setSourceRef] = useState(foodToEdit?.source_ref || '');
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Trap de foco e Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

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
  }, [isLoading, onClose]);

  // Cálculo de aviso de divergência calórica em tempo real
  const calNum = typeof calories === 'number' ? calories : 0;
  const pNum = typeof proteins === 'number' ? proteins : 0;
  const cNum = typeof carbs === 'number' ? carbs : 0;
  const fNum = typeof fats === 'number' ? fats : 0;
  const macroWarnings = calculateCaloricWarnings(calNum, pNum, cNum, fNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setClientError('O nome do alimento deve ter pelo menos 2 caracteres.');
      return;
    }

    if (calories === '' || calories < 0 || calories > 900) {
      setClientError('Calorias devem ser entre 0 e 900 kcal por 100 g/ml.');
      return;
    }

    if (proteins === '' || proteins < 0 || proteins > 100) {
      setClientError('Proteínas devem ser entre 0 e 100 g por 100 g/ml.');
      return;
    }

    if (carbs === '' || carbs < 0 || carbs > 100) {
      setClientError('Carboidratos devem ser entre 0 e 100 g por 100 g/ml.');
      return;
    }

    if (fats === '' || fats < 0 || fats > 100) {
      setClientError('Gorduras devem ser entre 0 e 100 g por 100 g/ml.');
      return;
    }

    if (pNum + cNum + fNum > 100.5) {
      setClientError('A soma de proteínas, carboidratos e gorduras não pode exceder 100,5 g por 100 g.');
      return;
    }

    const trimmedSourceRef = sourceRef.trim();
    if (!trimmedSourceRef || trimmedSourceRef.length < 2) {
      setClientError('A fonte de referência é obrigatória (ex.: "TACO 4ª ed., código 001", "Rótulo Marca X").');
      return;
    }

    const payload: AdminCreateFoodDTO = {
      name: trimmedName,
      calories: calNum,
      proteins: pNum,
      carbs: cNum,
      fats: fNum,
      base_unit: baseUnit,
      serving_weight: typeof servingWeight === 'number' && servingWeight > 0 ? servingWeight : 100,
      unit_name: unitName.trim() ? unitName.trim() : null,
      unit_weight: typeof unitWeight === 'number' && unitWeight > 0 ? unitWeight : null,
      source_ref: trimmedSourceRef,
    };

    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setClientError(msg);
    }
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-food-modal-title"
      className="w-full max-w-xl bg-card border-2 border-border shadow-hard flex flex-col max-h-[92vh] overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b-2 border-border bg-background flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary text-primary-foreground border-2 border-edge shrink-0 shadow-hard-fill">
            <Database className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="admin-food-modal-title"
              className="text-base sm:text-lg font-heading font-black text-foreground uppercase tracking-tight"
            >
              {foodToEdit ? 'Editar Alimento do Catálogo' : 'Novo Alimento no Catálogo'}
            </h2>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mt-0.5">
              Valores por 100 g / ml (D-22 / B9 & B12)
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="p-2 border-2 border-border bg-background text-foreground hover:bg-secondary transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {clientError && (
            <div
              role="alert"
              className="p-3 bg-destructive text-destructive-foreground font-bold text-xs uppercase tracking-wider border-2 border-transparent"
            >
              {clientError}
            </div>
          )}

          {/* Nome */}
          <div>
            <label
              htmlFor="admin-food-name"
              className="block text-xs font-black uppercase tracking-wider text-foreground mb-1"
            >
              Nome do Alimento *
            </label>
            <input
              id="admin-food-name"
              ref={nameInputRef}
              type="text"
              required
              maxLength={255}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="EX.: ARROZ BRANCO COZIDO"
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm bg-background border-2 border-border text-foreground font-mono uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
            />
          </div>

          {/* Nutrientes por 100g */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="admin-food-calories"
                className="block text-xs font-black uppercase tracking-wider text-foreground mb-1"
              >
                Kcal *
              </label>
              <input
                id="admin-food-calories"
                type="number"
                step="0.1"
                min="0"
                max="900"
                required
                value={calories}
                onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm bg-background border-2 border-border text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-food-proteins"
                className="block text-xs font-black uppercase tracking-wider text-foreground mb-1"
              >
                Proteínas (g) *
              </label>
              <input
                id="admin-food-proteins"
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={proteins}
                onChange={(e) => setProteins(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm bg-background border-2 border-border text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-food-carbs"
                className="block text-xs font-black uppercase tracking-wider text-foreground mb-1"
              >
                Carboidratos (g) *
              </label>
              <input
                id="admin-food-carbs"
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={carbs}
                onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm bg-background border-2 border-border text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-food-fats"
                className="block text-xs font-black uppercase tracking-wider text-foreground mb-1"
              >
                Gorduras (g) *
              </label>
              <input
                id="admin-food-fats"
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={fats}
                onChange={(e) => setFats(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm bg-background border-2 border-border text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
              />
            </div>
          </div>

          {/* Aviso de divergência calórica (B12) */}
          {macroWarnings.length > 0 && (
            <div
              role="note"
              className="p-3 bg-secondary border-2 border-border flex items-start gap-2.5 text-xs font-bold text-foreground"
            >
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-warning block font-black">
                  Aviso de cálculo teórico (não impede gravação):
                </span>
                {macroWarnings.map((w, idx) => (
                  <p key={idx} className="text-muted-foreground">{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Unidade base e Porção padrão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="admin-food-base-unit"
                className="block text-xs font-black uppercase tracking-wider text-foreground mb-1"
              >
                Unidade Base
              </label>
              <select
                id="admin-food-base-unit"
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value as 'g' | 'ml')}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm bg-background border-2 border-border text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
              >
                <option value="g">GRAMAS (g)</option>
                <option value="ml">MILILITROS (ml)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-food-serving-weight"
                className="block text-xs font-black uppercase tracking-wider text-foreground mb-1"
              >
                Porção Padrão de Referência ({baseUnit})
              </label>
              <input
                id="admin-food-serving-weight"
                type="number"
                step="1"
                min="1"
                value={servingWeight}
                onChange={(e) => setServingWeight(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm bg-background border-2 border-border text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
              />
            </div>
          </div>

          {/* Medida Caseira (Opcional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="admin-food-unit-name"
                className="block text-xs font-black uppercase tracking-wider text-foreground mb-1"
              >
                Medida Caseira (Opcional)
              </label>
              <input
                id="admin-food-unit-name"
                type="text"
                maxLength={50}
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="EX.: COLHER DE SOPA, FATIA"
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm bg-background border-2 border-border text-foreground font-mono uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-food-unit-weight"
                className="block text-xs font-black uppercase tracking-wider text-foreground mb-1"
              >
                Peso da Medida ({baseUnit})
              </label>
              <input
                id="admin-food-unit-weight"
                type="number"
                step="0.1"
                min="0.1"
                value={unitWeight}
                onChange={(e) => setUnitWeight(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="EX.: 25"
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm bg-background border-2 border-border text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
              />
            </div>
          </div>

          {/* Fonte de Referência (Obrigatória - B9) */}
          <div>
            <label
              htmlFor="admin-food-source-ref"
              className="block text-xs font-black uppercase tracking-wider text-foreground mb-1"
            >
              Fonte Oficial Auditável (B9) *
            </label>
            <input
              id="admin-food-source-ref"
              type="text"
              required
              maxLength={255}
              value={sourceRef}
              onChange={(e) => setSourceRef(e.target.value)}
              placeholder="EX.: TACO 4ª ED., CÓD. 001 OU RÓTULO PRODUTO X"
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm bg-background border-2 border-border text-foreground font-mono uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
            />
            <span className="text-[10px] text-muted-foreground block mt-1">
              Obrigatório para prevenir dados inventados. Toda alteração é auditada em log.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-background border-t-2 border-border flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 font-bold uppercase tracking-widest text-xs text-foreground bg-background border-2 border-border hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 font-black uppercase tracking-widest text-xs flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-edge shadow-hard-fill transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 min-h-[44px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Salvando...</span>
              </>
            ) : (
              <span>{foodToEdit ? 'Salvar Alterações' : 'Cadastrar Alimento'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export const AdminFoodModal: React.FC<AdminFoodModalProps> = ({
  isOpen,
  onClose,
  foodToEdit,
  onSubmit,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-background/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <AdminFoodFormInner
        key={foodToEdit?.id ?? 'create'}
        foodToEdit={foodToEdit}
        onSubmit={onSubmit}
        onClose={onClose}
        isLoading={isLoading}
      />
    </div>
  );
};
