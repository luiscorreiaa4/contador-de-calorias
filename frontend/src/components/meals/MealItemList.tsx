import React from 'react';
import { Flame, Trash2 } from 'lucide-react';
import type { MealItem } from '../../types/meal-modal';

interface MealItemListProps {
  items: MealItem[];
  isSubmitting: boolean;
  onRemoveItem: (uid: string) => void;
  onUpdateItemAmount: (uid: string, amount: number) => void;
}

interface EditableQuantityProps {
  item: MealItem;
  disabled: boolean;
  onCommit: (amount: number) => void;
}

/**
 * Edição inline da quantidade de um item do prato (sem precisar
 * remover e adicionar novamente).
 */
const EditableQuantity: React.FC<EditableQuantityProps> = ({ item, disabled, onCommit }) => {
  const isUnit = item.unit === 'un';
  const initial = isUnit ? item.displayAmount : Math.round(item.quantity);
  const [draft, setDraft] = React.useState(String(initial));

  const handleChange = (value: string) => {
    setDraft(value);
    const parsed = Number(value);
    if (value.trim() !== '' && Number.isFinite(parsed) && parsed > 0) {
      onCommit(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(parsed) || parsed <= 0) {
      setDraft(String(initial));
    }
  };

  return (
    <input
      type="number"
      min="0.1"
      step="any"
      value={draft}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={handleBlur}
      disabled={disabled}
      aria-label={`Quantidade de ${item.food.name}`}
      className="w-20 px-2 py-1 bg-background border-2 border-border text-[11px] font-black text-foreground focus:border-primary outline-none transition-colors disabled:opacity-50"
    />
  );
};

export const MealItemList: React.FC<MealItemListProps> = ({
  items,
  isSubmitting,
  onRemoveItem,
  onUpdateItemAmount,
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
              <div className="flex items-center gap-2 mt-1">
                <EditableQuantity
                  item={item}
                  disabled={isSubmitting}
                  onCommit={(amount) => onUpdateItemAmount(item.uid, amount)}
                />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {item.unit === 'un'
                    ? `${item.food.unit_name || 'UN'} (${Math.round(item.quantity)}G)`
                    : item.unit.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                P: {item.proteins}G • C: {item.carbs}G • G: {item.fats}G
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
