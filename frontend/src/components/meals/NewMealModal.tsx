import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Utensils,
  Plus,
  Loader2,
  Trash2,
  Flame,
  Scale,
  Info,
} from 'lucide-react';
import Select from 'react-select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFoods, type Food } from '../../services/food.service';
import { createMeal, updateMeal, type Meal, type CreateMealDTO } from '../../services/meal.service';

interface NewMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealToEdit?: Meal | null;
}

interface MealItem {
  uid: string;
  food: Food;
  quantity: number; // quantidade em g ou ml
  unit: 'g' | 'ml' | 'un';
  displayAmount: number; // número inserido pelo usuário
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

// Removido MEAL_TYPES

function calculateNutrients(food: Food, quantityInBaseUnit: number) {
  const serving = Number(food.serving_weight) || 100;
  const factor = quantityInBaseUnit / serving;
  return {
    calories: Math.round(Number(food.calories) * factor * 10) / 10,
    proteins: Math.round(Number(food.proteins) * factor * 10) / 10,
    carbs: Math.round(Number(food.carbs) * factor * 10) / 10,
    fats: Math.round(Number(food.fats) * factor * 10) / 10,
  };
}

export const NewMealModal: React.FC<NewMealModalProps> = ({ isOpen, onClose, mealToEdit }) => {
  const queryClient = useQueryClient();

  const { data: foodsData, isLoading: isLoadingFoods } = useQuery<Food[]>({
    queryKey: ['foods'],
    queryFn: getFoods,
    enabled: isOpen,
  });

  const foods = useMemo(() => foodsData || [], [foodsData]);

  const [mealName, setMealName] = useState('');
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Seleção e formulário do alimento atual
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [amountMode, setAmountMode] = useState<'un' | 'weight'>('weight');
  const [amount, setAmount] = useState<number | ''>('');

  const modalRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const foodOptions = useMemo(() => {
    return foods.map((food) => ({ value: food.id, label: food.name, food }));
  }, [foods]);

  const createMealMutation = useMutation({
    mutationFn: (data: CreateMealDTO) => createMeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayMeals'] });
      onClose();
    },
    onError: (error: Error) => {
      setErrorMessage(`Erro ao salvar: ${error.message}`);
    },
  });

  const updateMealMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateMealDTO }) => updateMeal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayMeals'] });
      onClose();
    },
    onError: (error: Error) => {
      setErrorMessage(`Erro ao salvar: ${error.message}`);
    },
  });

  const isSubmitting = createMealMutation.isPending || updateMealMutation.isPending;

  // Reset e inicialização ao abrir modal ou trocar refeição
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSelectedFood(null);
      setAmount('');

      const cachedMeals = queryClient.getQueryData<Meal[]>(['todayMeals']) || [];
      const nextMealNumber = cachedMeals.length + 1;

      if (mealToEdit && foods.length > 0) {
        setMealName(mealToEdit.name);

        const initialItems = mealToEdit.items
          .map((item) => {
            const food = foods.find((f) => f.id === item.food_id);
            if (!food) return null;

            const unit = (item.unit as 'g' | 'ml' | 'un') || (food.base_unit as 'g' | 'ml');
            const displayAmount = Number(item.display_amount ?? item.quantity);
            const quantity = Number(item.quantity);
            const nutrients = calculateNutrients(food, quantity);

            return {
              uid: `${item.food_id}-${Date.now()}-${Math.random()}`,
              food,
              quantity,
              unit,
              displayAmount,
              ...nutrients,
            };
          })
          .filter(Boolean) as MealItem[];

        setMealItems(initialItems);
      } else if (!mealToEdit) {
        setMealName(`Refeição ${nextMealNumber}`);
        setMealItems([]);
      }
    }
  }, [isOpen, mealToEdit, foods, queryClient]);

  // Tecla Escape e Focus Trap
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

  // Ao selecionar um alimento na lista
  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);

    // Se o alimento tiver suporte a unidade pré-definida (ex: ovo, banana, maçã), seleciona unidade como padrão
    if (food.unit_name && food.unit_weight) {
      setAmountMode('un');
      setAmount(1); // 1 unidade
    } else {
      setAmountMode('weight');
      setAmount(food.base_unit === 'ml' ? 200 : 100); // 100g ou 200ml padrão
    }

    setTimeout(() => {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }, 50);
  };

  // Calcula valores do alimento atualmente preenchido
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

  const totalCalories = mealItems.reduce((acc, item) => acc + item.calories, 0);
  const totalProteins = mealItems.reduce((acc, item) => acc + item.proteins, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mealItems.length === 0) return;

    const mealLabel = mealName.trim() || `Refeição ${(queryClient.getQueryData<Meal[]>(['todayMeals']) || []).length + 1}`;
    const timeToUse = mealToEdit ? new Date(mealToEdit.meal_time) : new Date();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-meal-modal-title"
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all flex flex-col max-h-[92vh]"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <Utensils className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="new-meal-modal-title"
                className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight"
              >
                {mealToEdit ? 'Editar Refeição' : 'Nova Refeição'}
              </h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Padronizado em gramas (g), mililitros (ml) e unidades
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

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* ── Meal Name Input ───────────────────────────────────────────── */}
            <div>
              <label htmlFor="meal-name" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Nome da Refeição
              </label>
              <input
                id="meal-name"
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="ex: Café da Manhã, Almoço..."
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* ── Food Picker Box ───────────────────────────────────────────── */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl p-4 space-y-3.5 border border-zinc-100 dark:border-zinc-700/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  Adicionar Alimento
                </span>
                {selectedFood && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFood(null);
                      setAmount('');
                    }}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    Escolher outro alimento
                  </button>
                )}
              </div>

              {/* Case 1: Nenhum alimento selecionado -> Campo de Busca e Dropdown */}
              {!selectedFood ? (
                <Select
                  options={foodOptions}
                  isLoading={isLoadingFoods}
                  onChange={(option) => {
                    if (option) handleSelectFood(option.food);
                  }}
                  placeholder="Pesquisar alimento (ex: frango, arroz, ovo, leite)..."
                  menuPortalTarget={document.body}
                  noOptionsMessage={() => 'Nenhum alimento encontrado'}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                  classNames={{
                    control: (state) =>
                      `bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl text-sm min-h-[46px] shadow-sm transition-colors border ${
                        state.isFocused
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'hover:border-emerald-500 dark:hover:border-emerald-500'
                      }`,
                    input: () => 'text-zinc-900 dark:text-zinc-100 py-0.5',
                    singleValue: () => 'text-zinc-900 dark:text-zinc-100',
                    menu: () => 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl mt-1.5 overflow-hidden',
                    option: (state) =>
                      `px-3.5 py-2.5 cursor-pointer transition-colors text-sm ${
                        state.isFocused
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100'
                          : 'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                      }`,
                    noOptionsMessage: () => 'text-zinc-500 dark:text-zinc-400 p-4 text-sm text-center',
                    placeholder: () => 'text-zinc-400 dark:text-zinc-500 px-1',
                    menuList: () => 'p-1',
                    valueContainer: () => 'px-3',
                    dropdownIndicator: () => 'p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300',
                    indicatorSeparator: () => 'hidden',
                    clearIndicator: () => 'p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300',
                  }}
                  unstyled
                />
              ) : (
                /* Case 2: Alimento SELECIONADO -> Mostra Card com Configuração de Quantidade */
                <div className="space-y-3">
                  {/* Banner do alimento selecionado */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {selectedFood.name}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Base: {selectedFood.calories} kcal / 100{selectedFood.base_unit}
                          {selectedFood.unit_name && selectedFood.unit_weight && (
                            <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">
                              (1 {selectedFood.unit_name} ≈ {Number(selectedFood.unit_weight)}g)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFood(null);
                        setAmount('');
                      }}
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      title="Trocar alimento"
                      aria-label="Trocar alimento"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Seletor de Modo: Unidades vs Gramas (para alimentos como ovo, banana, etc.) */}
                  {selectedFood.unit_name && selectedFood.unit_weight && (
                    <div>
                      <div className="flex rounded-lg bg-zinc-200/70 dark:bg-zinc-700/60 p-0.5 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => {
                            setAmountMode('un');
                            setAmount(1);
                          }}
                          className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                            amountMode === 'un'
                              ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
                              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                          }`}
                        >
                          <span>🔢 Por {selectedFood.unit_name}</span>
                          <span className="text-[10px] text-zinc-400 font-normal">
                            (aprox. {Number(selectedFood.unit_weight)}g)
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAmountMode('weight');
                            setAmount(Number(selectedFood.unit_weight));
                          }}
                          className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                            amountMode === 'weight'
                              ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
                              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                          }`}
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>Pesar em Gramas (balança)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Input de Quantidade Contextual */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="food-amount"
                        className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                      >
                        {amountMode === 'un'
                          ? `Quantidade de ${selectedFood.unit_name || 'unidades'}`
                          : selectedFood.base_unit === 'ml'
                          ? 'Quantidade em mililitros (ml)'
                          : 'Quantidade em gramas (g)'}
                      </label>
                      {amountMode === 'un' &&
                        selectedFood.unit_weight &&
                        amount &&
                        Number(amount) > 0 && (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                            <Info className="w-3 h-3 text-emerald-500" />
                            Equivale a{' '}
                            <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
                              {Number(amount) * Number(selectedFood.unit_weight)}g
                            </strong>
                          </span>
                        )}
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          id="food-amount"
                          ref={amountInputRef}
                          type="number"
                          min="0.1"
                          step={amountMode === 'un' ? '0.5' : '1'}
                          value={amount}
                          onChange={(e) =>
                            setAmount(e.target.value ? Number(e.target.value) : '')
                          }
                          placeholder={
                            amountMode === 'un'
                              ? 'ex: 2'
                              : selectedFood.base_unit === 'ml'
                              ? 'ex: 200'
                              : 'ex: 150'
                          }
                          className="w-full pl-3 pr-12 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-colors"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                          {amountMode === 'un'
                            ? selectedFood.unit_name || 'un'
                            : selectedFood.base_unit}
                        </span>
                      </div>

                      {/* Botão de Incluir */}
                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!amount || Number(amount) <= 0 || isSubmitting}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Incluir</span>
                      </button>
                    </div>

                  </div>

                  {/* Preview Nutricional em Tempo Real */}
                  {currentItemCalculations && (
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 animate-in fade-in duration-150">
                      <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 text-center">
                        <span className="block text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400">Calorias</span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{currentItemCalculations.calories} kcal</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 text-center">
                        <span className="block text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400">Proteína</span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{currentItemCalculations.proteins}g</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 text-center">
                        <span className="block text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400">Carbs</span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{currentItemCalculations.carbs}g</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 text-center">
                        <span className="block text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400">Gordura</span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{currentItemCalculations.fats}g</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Items List ───────────────────────────────────────────────── */}
            {mealItems.length > 0 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    Itens Adicionados
                    <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-bold">
                      {mealItems.length}
                    </span>
                  </span>
                  <div
                    className="flex items-center gap-2 text-xs font-bold"
                    aria-live="polite"
                    aria-label={`Total: ${totalCalories} calorias e ${totalProteins}g de proteína`}
                  >
                    <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                      {Math.round(totalCalories)} kcal
                    </span>
                    <span className="text-violet-600 dark:text-violet-400">
                      • {Math.round(totalProteins * 10) / 10}g prot
                    </span>
                  </div>
                </div>

                <ul
                  className="space-y-1.5 max-h-48 overflow-y-auto pr-1"
                  aria-label="Alimentos adicionados à refeição"
                >
                  {mealItems.map((item) => (
                    <li
                      key={item.uid}
                      className="flex items-center justify-between gap-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/60 rounded-xl px-3 py-2.5 animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                          {item.food.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {item.unit === 'un' ? (
                            <>
                              <strong className="text-zinc-700 dark:text-zinc-300">
                                {item.displayAmount}{' '}
                                {item.displayAmount === 1
                                  ? item.food.unit_name || 'unidade'
                                  : `${item.food.unit_name || 'unidade'}s`}
                              </strong>{' '}
                              ({Math.round(item.quantity)}g)
                            </>
                          ) : (
                            <strong className="text-zinc-700 dark:text-zinc-300">
                              {Math.round(item.quantity)} {item.unit}
                            </strong>
                          )}{' '}
                          • P: {item.proteins}g • C: {item.carbs}g • G: {item.fats}g
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-0.5">
                        <Flame className="w-3 h-3" aria-hidden="true" />
                        {Math.round(item.calories)} kcal
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

            {/* Empty state */}
            {mealItems.length === 0 && (
              <div className="text-center py-5 text-xs text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                Nenhum alimento incluído ainda. Busque e adicione acima.
              </div>
            )}
          </div>

          {/* ── Footer Buttons ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30 shrink-0">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {mealItems.length > 0 ? (
                <span>
                  Total da refeição:{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
                    {Math.round(totalCalories)} kcal
                  </strong>
                </span>
              ) : (
                <span>Adicione ao menos 1 alimento</span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
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
                    <span>{mealToEdit ? 'Salvar Alterações' : 'Salvar Refeição'}</span>
                    {mealItems.length > 0 && (
                      <span className="ml-0.5 bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {mealItems.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
