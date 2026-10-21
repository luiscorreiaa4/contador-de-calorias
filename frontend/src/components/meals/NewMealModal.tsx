import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Utensils, Star, Clock, Bookmark, Plus } from 'lucide-react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFoods, getRecentFoods, getFavoriteFoods, addFavoriteFood, removeFavoriteFood, createCustomFood, type Food, type CreateCustomFoodDTO } from '../../services/food.service';
import { createMeal, updateMeal, type Meal, type CreateMealDTO } from '../../services/meal.service';
import { getSavedMeals, createSavedMeal, deleteSavedMeal, type SavedMeal, type CreateSavedMealDTO } from '../../services/savedMeal.service';
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

  const {
    data: foodsData,
    isLoading: isLoadingFoods,
    isError: isFoodsError,
    isFetchNextPageError,
    isPlaceholderData,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
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
      allPages.reduce((total, page) => total + page.foods.length, 0) >= lastPage.total || lastPage.foods.length === 0
        ? undefined : allPages.length + 1,
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
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

  const [activeFoodTab, setActiveFoodTab] = useState<'search' | 'recents' | 'favorites' | 'combos' | 'custom'>('search');
  const [comboName, setComboName] = useState('');
  const [isSavingCombo, setIsSavingCombo] = useState(false);

  const [customFoodForm, setCustomFoodForm] = useState<{
    name: string;
    calories: string;
    proteins: string;
    carbs: string;
    fats: string;
    base_unit: 'g' | 'ml';
    unit_name: string;
    unit_weight: string;
  }>({
    name: '',
    calories: '',
    proteins: '',
    carbs: '',
    fats: '',
    base_unit: 'g',
    unit_name: '',
    unit_weight: '',
  });

  const createCustomFoodMutation = useMutation({
    mutationFn: (data: CreateCustomFoodDTO) => createCustomFood(data),
    onSuccess: (newFood) => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
      handleSelectFood(newFood);
      setActiveFoodTab('search');
      setCustomFoodForm({
        name: '',
        calories: '',
        proteins: '',
        carbs: '',
        fats: '',
        base_unit: 'g',
        unit_name: '',
        unit_weight: '',
      });
    },
    onError: (err: unknown) => {
      setErrorMessage(err instanceof Error ? err.message.toUpperCase() : 'ERRO AO CADASTRAR ALIMENTO.');
    },
  });


  const { data: recentFoods = [] } = useQuery({
    queryKey: ['recentFoods'],
    queryFn: ({ signal }) => getRecentFoods(signal),
    enabled: isOpen,
    staleTime: 1000 * 60 * 2,
  });

  const { data: favoriteFoods = [] } = useQuery({
    queryKey: ['favoriteFoods'],
    queryFn: ({ signal }) => getFavoriteFoods(signal),
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });

  const { data: savedMeals = [] } = useQuery({
    queryKey: ['savedMeals'],
    queryFn: ({ signal }) => getSavedMeals(signal),
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });

  const favoriteIds = useMemo(() => new Set(favoriteFoods.map((f) => f.id)), [favoriteFoods]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ foodId, isFav }: { foodId: string; isFav: boolean }) => {
      if (isFav) {
        await removeFavoriteFood(foodId);
      } else {
        await addFavoriteFood(foodId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteFoods'] });
    },
  });

  const createComboMutation = useMutation({
    mutationFn: (data: CreateSavedMealDTO) => createSavedMeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedMeals'] });
      setIsSavingCombo(false);
      setComboName('');
    },
    onError: (err: unknown) => {
      setErrorMessage(err instanceof Error ? err.message.toUpperCase() : 'ERRO AO SALVAR COMBO.');
    },
  });

  const deleteComboMutation = useMutation({
    mutationFn: (id: string) => deleteSavedMeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedMeals'] });
    },
  });

  const handleApplyCombo = (combo: SavedMeal) => {
    const newItems: MealItem[] = combo.items.map((it) => {
      const food: Food = {
        id: it.food_id,
        name: it.food_name,
        base_unit: (it.food_base_unit as 'g' | 'ml') || 'g',
        serving_weight: 100,
        calories: it.calories,
        proteins: it.proteins,
        carbs: it.carbs,
        fats: it.fats,
        unit_name: it.food_unit_name,
        unit_weight: it.food_unit_weight,
      };

      return {
        uid: `${it.food_id}-${Date.now()}-${Math.random()}`,
        food,
        quantity: it.quantity,
        unit: (it.unit as 'g' | 'ml' | 'un') || 'g',
        displayAmount: it.display_amount ?? it.quantity,
        calories: it.calories,
        proteins: it.proteins,
        carbs: it.carbs,
        fats: it.fats,
      };
    });

    setMealItems((prev) => [...prev, ...newItems]);
    setActiveFoodTab('search');
  };

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
            className="p-2 border-2 border-border bg-background text-foreground hover:bg-secondary transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                  className="w-full px-4 py-3 bg-background border-2 border-border text-sm font-black text-foreground uppercase placeholder:text-muted-foreground focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none transition-colors"
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
                  className="w-full px-4 py-3 bg-background border-2 border-border text-sm font-black text-foreground uppercase placeholder:text-muted-foreground focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none transition-colors text-center"
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
                    className="text-[10px] text-primary-ink hover:underline font-bold uppercase tracking-widest"
                  >
                    TROCAR ALIMENTO
                  </button>
                )}
              </div>

              {!selectedFood && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFoodTab('search')}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-black uppercase tracking-wider border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-x-px active:translate-y-px ${
                      activeFoodTab === 'search'
                        ? 'bg-primary text-primary-foreground border-black'
                        : 'bg-card text-foreground border-border hover:bg-background'
                    }`}
                  >
                    Catálogo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFoodTab('recents')}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-black uppercase tracking-wider border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-x-px active:translate-y-px ${
                      activeFoodTab === 'recents'
                        ? 'bg-primary text-primary-foreground border-black'
                        : 'bg-card text-foreground border-border hover:bg-background'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    Recentes ({recentFoods.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFoodTab('favorites')}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-black uppercase tracking-wider border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-x-px active:translate-y-px ${
                      activeFoodTab === 'favorites'
                        ? 'bg-primary text-primary-foreground border-black'
                        : 'bg-card text-foreground border-border hover:bg-background'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 shrink-0 text-warning fill-warning" />
                    Favoritos ({favoriteFoods.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFoodTab('combos')}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-black uppercase tracking-wider border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-x-px active:translate-y-px ${
                      activeFoodTab === 'combos'
                        ? 'bg-primary text-primary-foreground border-black'
                        : 'bg-card text-foreground border-border hover:bg-background'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 shrink-0" />
                    Combos ({savedMeals.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFoodTab('custom')}
                    className={`col-span-2 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-black uppercase tracking-widest border-2 border-dashed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-x-px active:translate-y-px ${
                      activeFoodTab === 'custom'
                        ? 'bg-primary text-primary-foreground border-black'
                        : 'bg-secondary text-foreground border-border hover:bg-card'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    Novo Alimento
                  </button>
                </div>
              )}

              {!selectedFood ? (
                activeFoodTab === 'custom' ? (
                  <div className="space-y-3 bg-card p-3 border-2 border-border">
                    <div className="flex items-center justify-between border-b-2 border-border pb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                        CADASTRAR ALIMENTO PERSONALIZADO
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveFoodTab('search')}
                        className="text-[10px] font-bold uppercase text-muted-foreground hover:text-foreground"
                      >
                        CANCELAR
                      </button>
                    </div>

                    <div>
                      <label htmlFor="custom-food-name" className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                        NOME DO ALIMENTO *
                      </label>
                      <input
                        id="custom-food-name"
                        type="text"
                        value={customFoodForm.name}
                        onChange={(e) => setCustomFoodForm((prev) => ({ ...prev, name: e.target.value.toUpperCase() }))}
                        placeholder="EX: WHEY PROTEIN CASEIRO..."
                        className="w-full px-3 py-1.5 bg-background border-2 border-border text-xs font-black uppercase outline-none focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                       <div>
                        <label htmlFor="custom-food-calories" className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                          KCAL / 100{customFoodForm.base_unit} *
                        </label>
                        <input
                          id="custom-food-calories"
                          type="number"
                          step="any"
                          value={customFoodForm.calories}
                          onChange={(e) => setCustomFoodForm((prev) => ({ ...prev, calories: e.target.value }))}
                          placeholder="0"
                          className="w-full px-2 py-1.5 bg-background border-2 border-border text-xs font-black uppercase outline-none focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-center"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="custom-food-proteins" className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                          PROT (G) *
                        </label>
                        <input
                          id="custom-food-proteins"
                          type="number"
                          step="any"
                          value={customFoodForm.proteins}
                          onChange={(e) => setCustomFoodForm((prev) => ({ ...prev, proteins: e.target.value }))}
                          placeholder="0"
                          className="w-full px-2 py-1.5 bg-background border-2 border-border text-xs font-black uppercase outline-none focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-center"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="custom-food-carbs" className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                          CARB (G) *
                        </label>
                        <input
                          id="custom-food-carbs"
                          type="number"
                          step="any"
                          value={customFoodForm.carbs}
                          onChange={(e) => setCustomFoodForm((prev) => ({ ...prev, carbs: e.target.value }))}
                          placeholder="0"
                          className="w-full px-2 py-1.5 bg-background border-2 border-border text-xs font-black uppercase outline-none focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-center"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="custom-food-fats" className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                          GORD (G) *
                        </label>
                        <input
                          id="custom-food-fats"
                          type="number"
                          step="any"
                          value={customFoodForm.fats}
                          onChange={(e) => setCustomFoodForm((prev) => ({ ...prev, fats: e.target.value }))}
                          placeholder="0"
                          className="w-full px-2 py-1.5 bg-background border-2 border-border text-xs font-black uppercase outline-none focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-center"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label htmlFor="custom-food-base-unit" className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                          UNIDADE BASE
                        </label>
                        <select
                          id="custom-food-base-unit"
                          value={customFoodForm.base_unit}
                          onChange={(e) => setCustomFoodForm((prev) => ({ ...prev, base_unit: e.target.value as 'g' | 'ml' }))}
                          className="w-full px-2 py-1.5 bg-background border-2 border-border text-xs font-black uppercase outline-none focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="g">GRAMAS (G)</option>
                          <option value="ml">MILILITROS (ML)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="custom-food-unit-name" className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                          PORÇÃO CASEIRA (OPCIONAL)
                        </label>
                        <input
                          id="custom-food-unit-name"
                          type="text"
                          value={customFoodForm.unit_name}
                          onChange={(e) => setCustomFoodForm((prev) => ({ ...prev, unit_name: e.target.value }))}
                          placeholder="EX: SCOOP, FATIA"
                          className="w-full px-2 py-1.5 bg-background border-2 border-border text-xs font-black uppercase outline-none focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <div>
                        <label htmlFor="custom-food-unit-weight" className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                          PESO DA PORÇÃO ({customFoodForm.base_unit})
                        </label>
                        <input
                          id="custom-food-unit-weight"
                          type="number"
                          step="any"
                          value={customFoodForm.unit_weight}
                          onChange={(e) => setCustomFoodForm((prev) => ({ ...prev, unit_weight: e.target.value }))}
                          placeholder="EX: 30"
                          className="w-full px-2 py-1.5 bg-background border-2 border-border text-xs font-black uppercase outline-none focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-center"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveFoodTab('search')}
                        className="px-3 py-1.5 border-2 border-border text-xs font-black uppercase hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        CANCELAR
                      </button>
                      <button
                        type="button"
                        disabled={createCustomFoodMutation.isPending || !customFoodForm.name.trim()}
                        onClick={() => {
                          const cal = parseFloat(customFoodForm.calories || '0');
                          const prot = parseFloat(customFoodForm.proteins || '0');
                          const carb = parseFloat(customFoodForm.carbs || '0');
                          const fat = parseFloat(customFoodForm.fats || '0');
                          const uWeight = customFoodForm.unit_weight ? parseFloat(customFoodForm.unit_weight) : undefined;

                          createCustomFoodMutation.mutate({
                            name: customFoodForm.name.trim(),
                            calories: isNaN(cal) ? 0 : cal,
                            proteins: isNaN(prot) ? 0 : prot,
                            carbs: isNaN(carb) ? 0 : carb,
                            fats: isNaN(fat) ? 0 : fat,
                            base_unit: customFoodForm.base_unit,
                            serving_weight: 100,
                            unit_name: customFoodForm.unit_name.trim() || undefined,
                            unit_weight: uWeight && !isNaN(uWeight) ? uWeight : undefined,
                          });
                        }}
                        className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:bg-primary/90 border-2 border-black disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {createCustomFoodMutation.isPending ? 'SALVANDO...' : 'CADASTRAR E SELECIONAR'}
                      </button>
                    </div>
                  </div>
                ) : activeFoodTab === 'search' ? (
                  <FoodSearchSelect
                    options={foodOptions}
                    isLoading={isLoadingFoods}
                    hasNextPage={Boolean(hasNextPage)}
                    isFetchingNextPage={isFetchingNextPage}
                    isError={isFoodsError}
                    isFetchNextPageError={isFetchNextPageError}
                    onLoadMore={() => {
                      if (hasNextPage && !isFetchingNextPage && !isPlaceholderData && searchTerm === debouncedSearch) {
                        void fetchNextPage({ cancelRefetch: false });
                      }
                    }}
                    onSearchChange={setSearchTerm}
                    onSelectFood={handleSelectFood}
                  />
                ) : activeFoodTab === 'recents' ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {recentFoods.length === 0 ? (
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground p-4 text-center">
                        NENHUM ALIMENTO RECENTE NOS ÚLTIMOS 14 DIAS
                      </p>
                    ) : (
                      recentFoods.map((food) => (
                        <div
                          key={food.id}
                          className="flex items-center justify-between p-2.5 bg-card border-2 border-border hover:border-foreground transition-colors"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-xs font-black uppercase text-foreground truncate">{food.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              {food.calories} KCAL · {food.proteins}G PROT
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleFavoriteMutation.mutate({ foodId: food.id, isFav: favoriteIds.has(food.id) })}
                              className="p-1.5 border-2 border-border text-foreground hover:text-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              title={favoriteIds.has(food.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            >
                              <Star className={`w-3.5 h-3.5 ${favoriteIds.has(food.id) ? 'fill-warning text-warning' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectFood(food)}
                              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground border-2 border-black hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : activeFoodTab === 'favorites' ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {favoriteFoods.length === 0 ? (
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground p-4 text-center">
                        NENHUM ALIMENTO FAVORITADO AINDA
                      </p>
                    ) : (
                      favoriteFoods.map((food) => (
                        <div
                          key={food.id}
                          className="flex items-center justify-between p-2.5 bg-card border-2 border-border hover:border-foreground transition-colors"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-xs font-black uppercase text-foreground truncate">{food.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              {food.calories} KCAL · {food.proteins}G PROT
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleFavoriteMutation.mutate({ foodId: food.id, isFav: true })}
                              className="p-1.5 border-2 border-border text-warning hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              title="Remover dos favoritos"
                            >
                              <Star className="w-3.5 h-3.5 fill-warning" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectFood(food)}
                              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground border-2 border-black hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {savedMeals.length === 0 ? (
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground p-4 text-center">
                        NENHUM COMBO SALVO AINDA
                      </p>
                    ) : (
                      savedMeals.map((combo) => (
                        <div
                          key={combo.id}
                          className="flex items-center justify-between p-2.5 bg-card border-2 border-border hover:border-foreground transition-colors"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-xs font-black uppercase text-foreground truncate">{combo.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              {combo.items.length} ITENS · {Math.round(combo.total_calories)} KCAL · {Math.round(combo.total_proteins)}G PROT
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => deleteComboMutation.mutate(combo.id)}
                              className="p-1.5 border-2 border-border text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              title="Excluir combo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyCombo(combo)}
                              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground border-2 border-black hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              Usar Combo
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )
              ) : (
                <FoodQuantityForm
                  selectedFood={selectedFood}
                  amountMode={amountMode}
                  amount={amount}
                  currentItemCalculations={currentItemCalculations}
                  amountInputRef={amountInputRef}
                  isSubmitting={isSubmitting}
                  isFavorite={Boolean(selectedFood && favoriteIds.has(selectedFood.id))}
                  onToggleFavorite={() => {
                    if (!selectedFood) return;
                    toggleFavoriteMutation.mutate({
                      foodId: selectedFood.id,
                      isFav: favoriteIds.has(selectedFood.id),
                    });
                  }}
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

            {/* Salvar como Combo Reutilizável */}
            {mealItems.length > 0 && (
              <div className="p-3 bg-secondary border-2 border-border space-y-2">
                {!isSavingCombo ? (
                  <button
                    type="button"
                    onClick={() => {
                      setComboName(mealName || 'MEU COMBO');
                      setIsSavingCombo(true);
                    }}
                    className="w-full py-2.5 px-3 border-2 border-dashed border-border hover:border-foreground text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Bookmark className="w-4 h-4 shrink-0 text-primary-ink" aria-hidden="true" />
                    <span className="leading-tight">Salvar itens atuais como combo reutilizável</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Nome do Combo
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={comboName}
                        onChange={(e) => setComboName(e.target.value.toUpperCase())}
                        placeholder="EX: CAFÉ DA MANHÃ PADRÃO..."
                        className="w-full sm:flex-1 min-w-0 px-3 py-2 bg-background border-2 border-border text-xs font-black uppercase placeholder:text-muted-foreground focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring outline-none"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={createComboMutation.isPending || !comboName.trim()}
                          onClick={() => {
                            createComboMutation.mutate({
                              name: comboName.trim(),
                              items: mealItems.map((item) => ({
                                foodId: item.food.id,
                                quantity: item.quantity,
                                unit: item.unit,
                                displayAmount: item.displayAmount,
                              })),
                            });
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:bg-primary/90 border-2 border-black disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {createComboMutation.isPending ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSavingCombo(false)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-background border-2 border-border text-xs font-black uppercase tracking-wider hover:bg-secondary text-foreground"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
