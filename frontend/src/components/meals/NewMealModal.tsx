import React, { useState, useEffect, useRef } from 'react';
import { X, Utensils, Plus, Loader2, Trash2, ChevronDown, Flame } from 'lucide-react';

interface NewMealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  unit: string;
  defaultAmount: number;
}

interface MealItem {
  uid: string;
  food: FoodItem;
  amount: number;
}

const MOCK_FOODS: FoodItem[] = [
  { id: '1', name: 'Arroz branco cozido', calories: 130, unit: 'g', defaultAmount: 100 },
  { id: '2', name: 'Feijão carioca cozido', calories: 76, unit: 'g', defaultAmount: 100 },
  { id: '3', name: 'Peito de frango grelhado', calories: 165, unit: 'g', defaultAmount: 100 },
  { id: '4', name: 'Filé de tilápia grelhado', calories: 96, unit: 'g', defaultAmount: 100 },
  { id: '5', name: 'Batata-doce cozida', calories: 86, unit: 'g', defaultAmount: 100 },
  { id: '6', name: 'Ovo cozido', calories: 77, unit: 'unid.', defaultAmount: 1 },
  { id: '7', name: 'Banana prata', calories: 89, unit: 'unid.', defaultAmount: 1 },
  { id: '8', name: 'Maçã', calories: 52, unit: 'g', defaultAmount: 100 },
  { id: '9', name: 'Pão francês', calories: 269, unit: 'g', defaultAmount: 50 },
  { id: '10', name: 'Iogurte natural desnatado', calories: 56, unit: 'g', defaultAmount: 170 },
];

const MEAL_TYPES = [
  { value: 'café da manhã', label: 'Café da Manhã', emoji: '🌅' },
  { value: 'almoço', label: 'Almoço', emoji: '☀️' },
  { value: 'lanche', label: 'Lanche', emoji: '🍎' },
  { value: 'jantar', label: 'Jantar', emoji: '🌙' },
];

function calcCalories(food: FoodItem, amount: number): number {
  return Math.round((food.calories / food.defaultAmount) * amount);
}

export const NewMealModal: React.FC<NewMealModalProps> = ({ isOpen, onClose }) => {
  const [mealType, setMealType] = useState('almoço');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const selectedFood = MOCK_FOODS.find((f) => f.id === selectedFoodId) ?? null;

  const totalCalories = mealItems.reduce(
    (acc, item) => acc + calcCalories(item.food, item.amount),
    0
  );

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setMealType('almoço');
      setSelectedFoodId('');
      setAmount('');
      setMealItems([]);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isSubmitting) onClose();

        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) { last?.focus(); e.preventDefault(); }
          } else {
            if (document.activeElement === last) { first?.focus(); e.preventDefault(); }
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
  }, [isOpen, isSubmitting, onClose]);

  // Auto-fill amount when food changes
  useEffect(() => {
    if (selectedFood) {
      setAmount(selectedFood.defaultAmount);
      setTimeout(() => amountInputRef.current?.focus(), 50);
    } else {
      setAmount('');
    }
  }, [selectedFoodId]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!selectedFood || !amount) return;
    setMealItems((prev) => [
      ...prev,
      { uid: `${selectedFood.id}-${Date.now()}`, food: selectedFood, amount: Number(amount) },
    ]);
    setSelectedFoodId('');
    setAmount('');
  };

  const handleRemoveItem = (uid: string) => {
    setMealItems((prev) => prev.filter((item) => item.uid !== uid));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mealItems.length === 0) return;
    setIsSubmitting(true);
    // Simulating API call — no backend changes yet
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  const canAddItem = !!selectedFood && !!amount && Number(amount) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-meal-modal-title"
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <Utensils className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="new-meal-modal-title" className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                Nova Refeição
              </h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Adicione quantos alimentos quiser
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">

            {/* ── Meal Type Tabs ───────────────────────────────────────────── */}
            <div>
              <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Tipo de Refeição
              </span>
              <div className="grid grid-cols-4 gap-1.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl p-1" role="group" aria-label="Tipo de refeição">
                {MEAL_TYPES.map((mt) => (
                  <button
                    key={mt.value}
                    type="button"
                    onClick={() => setMealType(mt.value)}
                    disabled={isSubmitting}
                    aria-pressed={mealType === mt.value}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                      mealType === mt.value
                        ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-200 dark:ring-emerald-700/50'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-base leading-none">{mt.emoji}</span>
                    <span className="truncate w-full text-center">{mt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Food Picker ──────────────────────────────────────────────── */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl p-4 space-y-3 border border-zinc-100 dark:border-zinc-700/60">
              <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Adicionar Alimento
              </span>

              {/* Select food */}
              <div className="relative">
                <select
                  id="food-select"
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-colors"
                  aria-label="Selecionar alimento"
                >
                  <option value="" disabled>Selecione um alimento…</option>
                  {MOCK_FOODS.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name} — {food.calories} kcal / {food.defaultAmount}{food.unit}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" aria-hidden="true" />
              </div>

              {/* Amount + kcal preview + add button */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label htmlFor="food-amount" className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Quantidade {selectedFood ? `(${selectedFood.unit})` : ''}
                  </label>
                  <input
                    id="food-amount"
                    ref={amountInputRef}
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="qtd."
                    disabled={!selectedFood || isSubmitting}
                    className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Calorie badge */}
                <div
                  className={`shrink-0 px-3 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-1.5 min-w-[90px] justify-center transition-all ${
                    canAddItem
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500'
                  }`}
                  aria-live="polite"
                  aria-label="Calorias estimadas"
                >
                  <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {canAddItem ? calcCalories(selectedFood!, Number(amount)) : '–'} kcal
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!canAddItem || isSubmitting}
                  className="shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center gap-1.5 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Incluir</span>
                </button>
              </div>
            </div>

            {/* ── Items List ───────────────────────────────────────────────── */}
            {mealItems.length > 0 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Itens da Refeição
                    <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-bold">
                      {mealItems.length}
                    </span>
                  </span>
                  <div
                    className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400"
                    aria-live="polite"
                    aria-label={`Total de calorias: ${totalCalories}`}
                  >
                    <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{totalCalories} kcal total</span>
                  </div>
                </div>

                <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1" aria-label="Alimentos adicionados">
                  {mealItems.map((item) => (
                    <li
                      key={item.uid}
                      className="flex items-center justify-between gap-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/60 rounded-xl px-3 py-2.5 animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                          {item.food.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {item.amount} {item.food.unit}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-0.5">
                        <Flame className="w-3 h-3" aria-hidden="true" />
                        {calcCalories(item.food, item.amount)} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.uid)}
                        disabled={isSubmitting}
                        className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/50 disabled:opacity-50"
                        aria-label={`Remover ${item.food.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empty state hint */}
            {mealItems.length === 0 && (
              <div className="text-center py-4 text-xs text-zinc-400 dark:text-zinc-500">
                Nenhum alimento adicionado ainda. Use o formulário acima para incluir itens.
              </div>
            )}
          </div>

          {/* ── Footer Buttons ───────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-sm rounded-xl transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={mealItems.length === 0 || isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Salvando…</span>
                </>
              ) : (
                <>
                  <Utensils className="w-4 h-4" aria-hidden="true" />
                  <span>Salvar Refeição</span>
                  {mealItems.length > 0 && (
                    <span className="ml-0.5 bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {mealItems.length}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
