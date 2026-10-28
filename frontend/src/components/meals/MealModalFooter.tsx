import React from 'react';
import { Utensils, Loader2 } from 'lucide-react';

interface MealModalFooterProps {
  itemsCount: number;
  totalCalories: number;
  isSubmitting: boolean;
  isEditing: boolean;
  onClose: () => void;
}

export const MealModalFooter: React.FC<MealModalFooterProps> = ({
  itemsCount,
  totalCalories,
  isSubmitting,
  isEditing,
  onClose,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t-2 border-border bg-background gap-4 shrink-0">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {itemsCount > 0 ? (
          <span>
            TOTAL DA REFEIÇÃO:{' '}
            <strong className="text-foreground text-sm font-black">
              {Math.round(totalCalories)} KCAL
            </strong>
          </span>
        ) : (
          <span>ADICIONE AO MENOS 1 ALIMENTO</span>
        )}
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 sm:flex-none px-6 py-3 font-black uppercase tracking-widest text-xs text-foreground bg-background border-2 border-border hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
        >
          CANCELAR
        </button>

        <button
          type="submit"
          disabled={itemsCount === 0 || isSubmitting}
          className="flex-1 sm:flex-none px-8 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all border-2 border-edge disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-hard-fill disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>SALVANDO...</span>
            </>
          ) : (
            <>
              <Utensils className="w-4 h-4" aria-hidden="true" />
              <span>{isEditing ? 'SALVAR' : 'CRIAR REFEIÇÃO'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
