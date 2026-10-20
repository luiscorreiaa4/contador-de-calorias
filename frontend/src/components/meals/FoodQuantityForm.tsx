import React from 'react';
import { Utensils, X, Scale, Info, Plus, Star } from 'lucide-react';
import type { Food } from '../../services/food.service';

interface NutrientCalc {
  quantityInBaseUnit: number;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

interface FoodQuantityFormProps {
  selectedFood: Food;
  amountMode: 'un' | 'weight';
  amount: number | '';
  currentItemCalculations: NutrientCalc | null;
  amountInputRef: React.RefObject<HTMLInputElement | null>;
  isSubmitting: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onSetAmountMode: (mode: 'un' | 'weight') => void;
  onSetAmount: (val: number | '') => void;
  onCancelSelection: () => void;
  onAddItem: () => void;
}

export const FoodQuantityForm: React.FC<FoodQuantityFormProps> = ({
  selectedFood,
  amountMode,
  amount,
  currentItemCalculations,
  amountInputRef,
  isSubmitting,
  isFavorite = false,
  onToggleFavorite,
  onSetAmountMode,
  onSetAmount,
  onCancelSelection,
  onAddItem,
}) => {
  return (
    <div className="space-y-4">
      {/* Informações do alimento selecionado */}
      <div className="flex items-center justify-between p-4 bg-card border-2 border-border shadow-hard">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary text-primary-foreground border-2 border-black">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-black text-sm text-foreground uppercase tracking-tight">
              {selectedFood.name}
            </h4>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              BASE: {selectedFood.calories} KCAL / 100{selectedFood.base_unit.toUpperCase()}
              {selectedFood.unit_name && selectedFood.unit_weight && (
                <span className="ml-1 text-primary-ink font-bold">
                  (1 {selectedFood.unit_name.toUpperCase()} ≈ {Number(selectedFood.unit_weight)}G)
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              className="p-1.5 border-2 border-transparent text-muted-foreground hover:border-border hover:text-foreground transition-colors"
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-warning text-warning' : ''}`} />
            </button>
          )}
          <button
            type="button"
            onClick={onCancelSelection}
            className="p-1.5 border-2 border-transparent text-muted-foreground hover:border-border hover:text-foreground transition-colors"
            title="Trocar alimento"
            aria-label="Trocar alimento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Alternador de unidade vs peso */}
      {selectedFood.unit_name && selectedFood.unit_weight && (
        <div className="flex gap-2 border-2 border-border p-1 bg-background">
          <button
            type="button"
            onClick={() => {
              onSetAmountMode('un');
              onSetAmount(1);
            }}
            className={`flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none flex items-center justify-center gap-2 ${
              amountMode === 'un'
                ? 'bg-primary text-primary-foreground border-2 border-black'
                : 'bg-background text-foreground border-2 border-transparent hover:border-border'
            }`}
          >
            POR {selectedFood.unit_name.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={() => {
              onSetAmountMode('weight');
              onSetAmount(Number(selectedFood.unit_weight));
            }}
            className={`flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none flex items-center justify-center gap-2 ${
              amountMode === 'weight'
                ? 'bg-primary text-primary-foreground border-2 border-black'
                : 'bg-background text-foreground border-2 border-transparent hover:border-border'
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> PESAR EM GRAMAS
          </button>
        </div>
      )}

      {/* Input de quantidade e botão incluir */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="food-amount" className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            {amountMode === 'un'
              ? `QUANTIDADE DE ${selectedFood.unit_name?.toUpperCase() || 'UNIDADES'}`
              : selectedFood.base_unit === 'ml'
              ? 'QUANTIDADE EM MILILITROS (ML)'
              : 'QUANTIDADE EM GRAMAS (G)'}
          </label>
          {amountMode === 'un' && selectedFood.unit_weight && amount && Number(amount) > 0 && (
            <span className="text-[10px] font-bold text-primary-ink uppercase tracking-widest flex items-center gap-1">
              <Info className="w-3 h-3" />
              EQUIVALE A {Number(amount) * Number(selectedFood.unit_weight)}G
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              id="food-amount"
              ref={amountInputRef}
              type="number"
              min="0.1"
              step={amountMode === 'un' ? '0.5' : '1'}
              value={amount}
              onChange={(e) => onSetAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder={amountMode === 'un' ? 'EX: 2' : selectedFood.base_unit === 'ml' ? 'EX: 200' : 'EX: 150'}
              aria-label="Quantidade do alimento"
              className="w-full px-4 py-3 bg-background border-2 border-border text-sm font-black text-foreground uppercase placeholder:text-muted-foreground focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase pointer-events-none">
              {amountMode === 'un' ? selectedFood.unit_name || 'UN' : selectedFood.base_unit}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={onToggleFavorite}
                title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                className={`min-h-12 px-4 border-2 border-border transition-colors flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider ${
                  isFavorite
                    ? 'bg-warning/10 border-warning text-warning hover:bg-warning/20'
                    : 'bg-background hover:bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                <Star className={`w-4 h-4 shrink-0 ${isFavorite ? 'fill-warning text-warning' : ''}`} />
                <span className="hidden sm:inline">{isFavorite ? 'FAVORITO' : 'FAVORITAR'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onAddItem}
              disabled={!amount || Number(amount) <= 0 || isSubmitting}
              className="flex-1 sm:flex-none min-h-12 px-6 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all border-2 border-black shadow-hard-fill disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>INCLUIR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid com macros do item atual */}
      {currentItemCalculations && (
        <div className="grid grid-cols-4 gap-3 pt-4 border-t-2 border-border">
          <div className="p-3 border-2 border-border bg-background text-center">
            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">CALORIAS</span>
            <span className="text-sm font-heading font-black text-foreground">{currentItemCalculations.calories}</span>
          </div>
          <div className="p-3 border-2 border-border bg-background text-center">
            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">PROT</span>
            <span className="text-sm font-heading font-black text-foreground">{currentItemCalculations.proteins}G</span>
          </div>
          <div className="p-3 border-2 border-border bg-background text-center">
            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">CARBS</span>
            <span className="text-sm font-heading font-black text-foreground">{currentItemCalculations.carbs}G</span>
          </div>
          <div className="p-3 border-2 border-border bg-background text-center">
            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">GORD</span>
            <span className="text-sm font-heading font-black text-foreground">{currentItemCalculations.fats}G</span>
          </div>
        </div>
      )}
    </div>
  );
};
