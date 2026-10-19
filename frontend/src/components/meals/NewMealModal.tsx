import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Utensils } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFoods, type Food } from '../../services/food.service';
import { createMeal, updateMeal, type Meal, type CreateMealDTO } from '../../services/meal.service';
import { FoodSearchSelect } from './FoodSearchSelect';
import { FoodQuantityForm } from './FoodQuantityForm';
import { MealItemList } from './MealItemList';
import { MealModalFooter } from './MealModalFooter';
import { calculateNutrients, type MealItem, type FoodOption } from '../../types/meal-modal';
import { parseLocalDateString } from '../../utils/date';

/** Tamanho da página do autocomplete de alimentos. */
const FOOD_PAGE_SIZE = 50;

interface NewMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealToEdit?: Meal | null;
  /** Data (YYYY-MM-DD) em que a refeição será registrada; padrão: hoje. */
  mealDate?: string;
}

export const NewMealModal: React.FC<NewMealModalProps> = ({ isOpen, onClose, mealToEdit, mealDate }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: foodsData, isLoading: isLoadingFoods, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['foods', debouncedSearch],
    queryFn: ({ pageParam, signal }) =>
      getFoods(
        debouncedSearch.length >= 2 ? debouncedSearch : '',
        pageParam,
        FOOD_PAGE_SIZE,
        signal
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.foods.length < FOOD_PAGE_SIZE ? undefined : allPages.length + 1,
    enabled: isOpen,
    placeholderData: (previousData) => previousData,
  });

  const foods = useMemo(() => foodsData?.pages.flatMap((page) => page.foods) ?? [], [foodsData]);

  const [mealName, setMealName] = useState('');
  const [mealTimeStr, setMealTimeStr] = useState('');
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [amountMode, setAmountMode] = useState<'un' | 'weight'>('weight');
  const [amount, setAmount] = useState<number | ''>('');

  const modalRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const foodOptions: FoodOption[] = useMemo(() => {
    return foods.map((food) => ({ value: food.id, label: food.name.toUpperCase(), food }));
  }, [foods]);

  const createMealMutation = useMutation({
    mutationFn: (data: CreateMealDTO) => createMeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayMeals'] });
      queryClient.invalidateQueries({ queryKey: ['mealStats'] });
      onClose();
    },
    onError: (error: Error) => {
      setErrorMessage(`ERRO AO SALVAR: ${error.message.toUpperCase()}`);
    },
  });

  const updateMealMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateMealDTO }) => updateMeal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayMeals'] });
      queryClient.invalidateQueries({ queryKey: ['mealStats'] });
      onClose();
    },
    onError: (error: Error) => {
      setErrorMessage(`ERRO AO SALVAR: ${error.message.toUpperCase()}`);
    },
  });

  const isSubmitting = createMealMutation.isPending || updateMealMutation.isPending;
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }

    if (isOpen && !hasInitializedRef.current) {
      setErrorMessage(null);
      setSelectedFood(null);
      setAmount('');

      const cachedMeals =
        (mealDate ? queryClient.getQueryData<Meal[]>(['todayMeals', mealDate]) : undefined) ??
        queryClient.getQueryData<Meal[]>(['todayMeals']) ??
        [];
      const nextMealNumber = cachedMeals.length + 1;

      if (mealToEdit) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMealName(mealToEdit.name.toUpperCase());
        const editDate = new Date(mealToEdit.meal_time);
        setMealTimeStr(
          `${editDate.getHours().toString().padStart(2, '0')}:${editDate.getMinutes().toString().padStart(2, '0')}`
        );

        const initialItems = mealToEdit.items
          .map((item) => {
            const quantity = Number(item.quantity);
            const factor = quantity > 0 ? quantity / 100 : 1;
            const existingFood = foods.find((f) => f.id === item.food_id);

            const mockFood: Food = existingFood || {
              id: item.food_id,
              name: item.food_name || 'ALIMENTO',
              base_unit: (item.food_base_unit as 'g' | 'ml') || 'g',
              serving_weight: 100,
              calories: factor > 0 ? Number(item.calories) / factor : 0,
              proteins: factor > 0 ? Number(item.proteins) / factor : 0,
              carbs: factor > 0 ? Number(item.carbs) / factor : 0,
              fats: factor > 0 ? Number(item.fats) / factor : 0,
              unit_name: item.food_unit_name,
              unit_weight: item.food_unit_weight,
            };

            const unit = (item.unit as 'g' | 'ml' | 'un') || mockFood.base_unit;
            const displayAmount = Number(item.display_amount ?? item.quantity);

            return {
              uid: `${item.food_id}-${Date.now()}-${Math.random()}`,
              food: mockFood,
              quantity,
              unit,
              displayAmount,
              calories: Number(item.calories),
              proteins: Number(item.proteins),
              carbs: Number(item.carbs),
              fats: Number(item.fats),
            };
          })
          .filter(Boolean) as MealItem[];

        setMealItems(initialItems);
      } else {
        setMealName(`REFEIÇÃO ${nextMealNumber}`);
        const now = new Date();
        setMealTimeStr(
          `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        );
        setMealItems([]);
      }
      hasInitializedRef.current = true;
    }
  }, [isOpen, mealToEdit, queryClient, foods, mealDate]);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isSubmitting) {
          onClose();
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
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
    }
  }, [isOpen, isSubmitting, onClose]);

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);

    if (food.unit_name && food.unit_weight) {
      setAmountMode('un');
      setAmount(1);
    } else {
      setAmountMode('weight');
      setAmount(food.base_unit === 'ml' ? 200 : 100);
    }

    setTimeout(() => {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }, 50);
  };

  const currentItemCalculations = useMemo(() => {
    if (!selectedFood || !amount || Number(amount) <= 0) return null;

    const numAmount = Number(amount);
    let quantityInBaseUnit = numAmount;

    if (amountMode === 'un' && selectedFood.unit_weight) {
      quantityInBaseUnit = numAmount * Number(selectedFood.unit_weight);
    }

    const nutrients = calculateNutrients(selectedFood, quantityInBaseUnit);
    return {
      quantityInBaseUnit,
      ...nutrients,
    };
  }, [selectedFood, amount, amountMode]);

  const handleAddItem = () => {
    if (!selectedFood || !amount || Number(amount) <= 0 || !currentItemCalculations) return;

    const numAmount = Number(amount);
    const itemUnit = amountMode === 'un' ? 'un' : selectedFood.base_unit;

    const newItem: MealItem = {
      uid: `${selectedFood.id}-${Date.now()}`,
      food: selectedFood,
      quantity: currentItemCalculations.quantityInBaseUnit,
      unit: itemUnit,
      displayAmount: numAmount,
      calories: currentItemCalculations.calories,
      proteins: currentItemCalculations.proteins,
      carbs: currentItemCalculations.carbs,
      fats: currentItemCalculations.fats,
    };

    setMealItems((prev) => [...prev, newItem]);
    setSelectedFood(null);
    setAmount('');
  };

  const handleRemoveItem = (uid: string) => {
    setMealItems((prev) => prev.filter((item) => item.uid !== uid));
  };

  /**
   * Edição inline da quantidade de um item já adicionado ao prato.
   * Recalcula os macros proporcionalmente a partir dos valores base do alimento.
   */
  const handleUpdateItemAmount = (uid: string, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;

    setMealItems((prev) =>
      prev.map((item) => {
        if (item.uid !== uid) return item;

        const unitWeight = Number(item.food.unit_weight) || 0;
        const quantityInBaseUnit =
          item.unit === 'un' && unitWeight > 0 ? amount * unitWeight : amount;

        const nutrients = calculateNutrients(item.food, quantityInBaseUnit);

        return {
          ...item,
          quantity: Math.round(quantityInBaseUnit * 100) / 100,
          displayAmount: amount,
          ...nutrients,
        };
      })
    );
  };

  const totalCalories = mealItems.reduce((acc, item) => acc + item.calories, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mealItems.length === 0) return;

    const mealLabel = mealName.trim() || `REFEIÇÃO ${((mealDate ? queryClient.getQueryData<Meal[]>(['todayMeals', mealDate]) : undefined) ?? queryClient.getQueryData<Meal[]>(['todayMeals']) ?? []).length + 1}`;
    // Ao editar preserva a data original; ao criar usa a data selecionada no Dashboard.
    const timeToUse = mealToEdit ? new Date(mealToEdit.meal_time) : parseLocalDateString(mealDate);

    if (mealTimeStr.trim()) {
      if (mealTimeStr.length !== 5) {
        setErrorMessage('FORMATO DE HORÁRIO INVÁLIDO. USE HH:MM (EX: 14:30).');
        return;
      }
      const [hoursStr, minutesStr] = mealTimeStr.split(':');
      const hours = Number(hoursStr);
      const minutes = Number(minutesStr);

      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        setErrorMessage('HORÁRIO INVÁLIDO. POR FAVOR, INSIRA UM HORÁRIO REAL.');
        return;
      }
      timeToUse.setHours(hours, minutes, 0, 0);
    }

    const payload: CreateMealDTO = {
      name: mealLabel,
      mealTime: timeToUse.toISOString(),
      items: mealItems.map((item) => ({
        foodId: item.food.id,
        quantity: item.quantity,
        unit: item.unit,
        displayAmount: item.displayAmount,
      })),
    };

    if (mealToEdit) {
      updateMealMutation.mutate({ id: mealToEdit.id, data: payload });
    } else {
      createMealMutation.mutate(payload);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-background/90 backdrop-blur-sm">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-meal-modal-title"
        className="w-full max-w-xl bg-card border-2 border-border shadow-hard overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 border-b-2 border-border flex items-center justify-between bg-background shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary text-primary-foreground shrink-0 border-2 border-transparent">
              <Utensils className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="new-meal-modal-title"
                className="text-lg font-heading font-black text-foreground uppercase tracking-tight mb-1"
              >
                {mealToEdit ? 'EDITAR REFEIÇÃO' : 'NOVA REFEIÇÃO'}
              </h2>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                MONTE SUA REFEIÇÃO
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 border-2 border-border bg-background text-foreground hover:bg-secondary transition-colors disabled:opacity-50 focus:outline-none focus:border-primary"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-4 bg-destructive text-destructive-foreground font-bold text-xs uppercase tracking-widest flex items-center justify-between border-2 border-transparent">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-destructive-foreground hover:opacity-80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Header / Name and Time */}
            <div className="grid grid-cols-[1fr_100px] gap-4">
              <div>
                <label htmlFor="meal-name" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  NOME
                </label>
                <input
                  id="meal-name"
                  type="text"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value.toUpperCase())}
                  placeholder="EX: ALMOÇO..."
                  className="w-full px-4 py-3 bg-background border-2 border-border text-sm font-black text-foreground uppercase placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="meal-time" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  HORÁRIO
                </label>
                <input
                  id="meal-time"
                  type="text"
                  value={mealTimeStr}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 4) val = val.slice(0, 4);
                    if (val.length >= 3) {
                      val = `${val.slice(0, 2)}:${val.slice(2)}`;
                    }
                    setMealTimeStr(val);
                  }}
                  placeholder="00:00"
                  className="w-full px-4 py-3 bg-background border-2 border-border text-sm font-black text-foreground uppercase placeholder:text-muted-foreground focus:border-primary outline-none transition-colors text-center"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Food Picker Box */}
            <div className="bg-secondary p-4 border-2 border-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-widest">
                  ADICIONAR ALIMENTO
                </span>
                {selectedFood && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFood(null);
                      setAmount('');
                    }}
                    className="text-[10px] text-primary hover:underline font-bold uppercase tracking-widest"
                  >
                    TROCAR ALIMENTO
                  </button>
                )}
              </div>

              {!selectedFood ? (
                <FoodSearchSelect
                  options={foodOptions}
                  isLoading={isLoadingFoods}
                  hasNextPage={Boolean(hasNextPage)}
                  isFetchingNextPage={isFetchingNextPage}
                  onLoadMore={() => {
                    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
                  }}
                  onSearchChange={setSearchTerm}
                  onSelectFood={handleSelectFood}
                />
              ) : (
                <FoodQuantityForm
                  selectedFood={selectedFood}
                  amountMode={amountMode}
                  amount={amount}
                  currentItemCalculations={currentItemCalculations}
                  amountInputRef={amountInputRef}
                  isSubmitting={isSubmitting}
                  onSetAmountMode={setAmountMode}
                  onSetAmount={setAmount}
                  onCancelSelection={() => {
                    setSelectedFood(null);
                    setAmount('');
                  }}
                  onAddItem={handleAddItem}
                />
              )}
            </div>

            {/* Items List */}
            <MealItemList
              items={mealItems}
              isSubmitting={isSubmitting}
              onRemoveItem={handleRemoveItem}
              onUpdateItemAmount={handleUpdateItemAmount}
            />
          </div>

          {/* Footer Buttons */}
          <MealModalFooter
            itemsCount={mealItems.length}
            totalCalories={totalCalories}
            isSubmitting={isSubmitting}
            isEditing={Boolean(mealToEdit)}
            onClose={onClose}
          />
        </form>
      </div>
    </div>
  );
};
