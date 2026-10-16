import React from 'react';
import { Flame, Trash2 } from 'lucide-react';
import type { MealItem } from '../../types/meal-modal';

interface MealItemListProps {
  items: MealItem[];
  isSubmitting: boolean;
  onRemoveItem: (uid: string) => void;
}

export const MealItemList: React.FC<MealItemListProps> = ({
  items,
  isSubmitting,
  onRemoveItem,
}) => {
  const totalCalories = items.reduce((acc, item) => acc + item.calories, 0);
  const totalProteins = items.reduce((acc, item) => acc + item.proteins, 0);

  if (items.length === 0) {
    return (
      <div className="text-center p-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-2 border-dashed border-border bg-secondary">
        NENHUM ALIMENTO INCLUÍDO AINDA. BUSQUE E ADICIONE ACIMA.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b-2 border-border">
        <span className="text-[11px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          ITENS ADICIONADOS
          <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-black">
            {items.length}
          </span>
        </span>
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
          <span className="text-foreground flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" aria-hidden="true" />
            {Math.round(totalCalories)} KCAL
          </span>
          <span className="text-primary">
            • {Math.round(totalProteins * 10) / 10}G PROT
          </span>
        </div>
      </div>

      <ul className="space-y-3 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <li
            key={item.uid}
            className="flex items-center justify-between gap-4 bg-card border-2 border-border p-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-black text-foreground uppercase tracking-tight truncate">
                {item.food.name}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                {item.unit === 'un' ? (
                  <>
                    <strong className="text-foreground">
                      {item.displayAmount}{' '}
                      {item.displayAmount === 1
                        ? item.food.unit_name || 'UN'
                        : `${item.food.unit_name || 'UN'}S`}
                    </strong>{' '}
                    ({Math.round(item.quantity)}G)
                  </>
                ) : (
                  <strong className="text-foreground">
                    {Math.round(item.quantity)} {item.unit.toUpperCase()}
                  </strong>
                )}{' '}
                • P: {item.proteins}G • C: {item.carbs}G • G: {item.fats}G
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-black text-foreground flex items-center gap-1 uppercase tracking-widest bg-secondary px-2 py-1 border-2 border-border">
              <Flame className="w-3 h-3 text-primary" aria-hidden="true" />
              {Math.round(item.calories)} KCAL
            </span>
            <button
              type="button"
              onClick={() => onRemoveItem(item.uid)}
              disabled={isSubmitting}
              className="shrink-0 p-2 border-2 border-transparent text-muted-foreground hover:border-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors focus:outline-none disabled:opacity-50"
              aria-label={`Remover ${item.food.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
