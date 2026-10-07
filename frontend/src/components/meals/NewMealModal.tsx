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
import Select, { components, type MenuListProps } from 'react-select';
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
  quantity: number;
  unit: 'g' | 'ml' | 'un';
  displayAmount: number;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

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

const CustomMenuList = (props: MenuListProps) => {
  const children = React.Children.toArray(props.children);
  const MAX_ITEMS = 50;

  return (
    <components.MenuList {...props}>
      {children.length > MAX_ITEMS ? children.slice(0, MAX_ITEMS) : children}
      {children.length > MAX_ITEMS && (
        <div className="text-[10px] font-bold uppercase tracking-widest text-center py-3 text-muted-foreground bg-secondary border-t-2 border-border">
          + {children.length - MAX_ITEMS} ALIMENTOS... DIGITE PARA BUSCAR.
        </div>
      )}
    </components.MenuList>
  );
};

export const NewMealModal: React.FC<NewMealModalProps> = ({ isOpen, onClose, mealToEdit }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: foodsData, isLoading: isLoadingFoods } = useQuery({
    queryKey: ['foods', debouncedSearch],
    queryFn: () => getFoods(debouncedSearch.length >= 2 ? debouncedSearch : '', 1, 50),
    enabled: isOpen,
    placeholderData: (previousData) => previousData,
  });

  const foods = useMemo(() => foodsData?.foods || [], [foodsData]);

  const [mealName, setMealName] = useState('');
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [amountMode, setAmountMode] = useState<'un' | 'weight'>('weight');
  const [amount, setAmount] = useState<number | ''>('');

  const modalRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const foodOptions = useMemo(() => {
    return foods.map((food) => ({ value: food.id, label: food.name.toUpperCase(), food }));
  }, [foods]);

  const createMealMutation = useMutation({
    mutationFn: (data: CreateMealDTO) => createMeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayMeals'] });
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
      onClose();
    },
    onError: (error: Error) => {
      setErrorMessage(`ERRO AO SALVAR: ${error.message.toUpperCase()}`);
    },
  });

  const isSubmitting = createMealMutation.isPending || updateMealMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSelectedFood(null);
      setAmount('');

      const cachedMeals = queryClient.getQueryData<Meal[]>(['todayMeals']) || [];
      const nextMealNumber = cachedMeals.length + 1;

      if (mealToEdit && foods.length > 0) {
        setMealName(mealToEdit.name.toUpperCase());

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
        setMealName(`REFEIÇÃO ${nextMealNumber}`);
        setMealItems([]);
      }
    }
  }, [isOpen, mealToEdit, foods, queryClient]);

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

  const totalCalories = mealItems.reduce((acc, item) => acc + item.calories, 0);
  const totalProteins = mealItems.reduce((acc, item) => acc + item.proteins, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mealItems.length === 0) return;

    const mealLabel = mealName.trim() || `REFEIÇÃO ${(queryClient.getQueryData<Meal[]>(['todayMeals']) || []).length + 1}`;
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
            {/* Meal Name Input */}
            <div>
              <label htmlFor="meal-name" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                NOME DA REFEIÇÃO
              </label>
              <input
                id="meal-name"
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value.toUpperCase())}
                placeholder="EX: CAFÉ DA MANHÃ, ALMOÇO..."
                className="w-full px-4 py-3 bg-background border-2 border-border text-sm font-black text-foreground uppercase placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
                disabled={isSubmitting}
              />
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
                <Select
                  options={foodOptions}
                  isLoading={isLoadingFoods}
                  onInputChange={(newValue, { action }) => {
                    if (action === 'input-change') setSearchTerm(newValue);
                  }}
                  onChange={(option: { food: Food; label: string; value: string } | null) => {
                    if (option) handleSelectFood(option.food);
                  }}
                  placeholder="PESQUISAR ALIMENTO..."
                  menuPortalTarget={document.body}
                  noOptionsMessage={() => 'NENHUM ALIMENTO ENCONTRADO'}
                  components={{ MenuList: CustomMenuList }}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                  classNames={{
                    control: (state) =>
                      `bg-background border-2 border-border rounded-none text-xs font-black shadow-none transition-colors min-h-[48px] uppercase ${
                        state.isFocused
                          ? 'border-primary'
                          : 'hover:border-primary/50'
                      }`,
                    input: () => 'text-foreground py-0.5 uppercase',
                    singleValue: () => 'text-foreground uppercase',
                    menu: () => 'bg-card border-2 border-border rounded-none shadow-hard mt-2 overflow-hidden',
                    option: (state) =>
                      `px-4 py-3 cursor-pointer transition-colors text-[10px] font-bold uppercase tracking-widest ${
                        state.isFocused
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-secondary'
                      }`,
                    noOptionsMessage: () => 'text-muted-foreground p-4 text-[10px] font-bold uppercase tracking-widest text-center',
                    placeholder: () => 'text-muted-foreground px-1 uppercase',
                    menuList: () => 'p-0',
                    valueContainer: () => 'px-4',
                    dropdownIndicator: () => 'p-2 text-muted-foreground hover:text-foreground',
                    indicatorSeparator: () => 'hidden',
                    clearIndicator: () => 'p-2 text-muted-foreground hover:text-foreground',
                  }}
                  unstyled
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-card border-2 border-border shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary text-primary-foreground border-2 border-transparent">
                        <Utensils className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-heading font-black text-sm text-foreground uppercase tracking-tight">
                          {selectedFood.name}
                        </h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                          BASE: {selectedFood.calories} KCAL / 100{selectedFood.base_unit.toUpperCase()}
                          {selectedFood.unit_name && selectedFood.unit_weight && (
                            <span className="ml-1 text-primary font-bold">
                              (1 {selectedFood.unit_name.toUpperCase()} ≈ {Number(selectedFood.unit_weight)}G)
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
                      className="p-1 border-2 border-transparent text-muted-foreground hover:border-border hover:text-foreground transition-colors"
                      title="Trocar alimento"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {selectedFood.unit_name && selectedFood.unit_weight && (
                    <div className="flex gap-2 border-2 border-border p-1 bg-background">
                      <button
                        type="button"
                        onClick={() => {
                          setAmountMode('un');
                          setAmount(1);
                        }}
                        className={`flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none flex items-center justify-center gap-2 ${
                          amountMode === 'un'
                            ? 'bg-primary text-primary-foreground border-2 border-transparent'
                            : 'bg-background text-foreground border-2 border-transparent hover:border-border'
                        }`}
                      >
                        POR {selectedFood.unit_name.toUpperCase()}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAmountMode('weight');
                          setAmount(Number(selectedFood.unit_weight));
                        }}
                        className={`flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none flex items-center justify-center gap-2 ${
                          amountMode === 'weight'
                            ? 'bg-primary text-primary-foreground border-2 border-transparent'
                            : 'bg-background text-foreground border-2 border-transparent hover:border-border'
                        }`}
                      >
                        <Scale className="w-3.5 h-3.5" /> PESAR EM GRAMAS
                      </button>
                    </div>
                  )}

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
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
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
                          onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                          placeholder={amountMode === 'un' ? 'EX: 2' : selectedFood.base_unit === 'ml' ? 'EX: 200' : 'EX: 150'}
                          className="w-full px-4 py-3 bg-background border-2 border-border text-sm font-black text-foreground uppercase placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase pointer-events-none">
                          {amountMode === 'un' ? selectedFood.unit_name || 'UN' : selectedFood.base_unit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!amount || Number(amount) <= 0 || isSubmitting}
                        className="px-6 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-foreground"
                      >
                        <Plus className="w-4 h-4" />
                        <span>INCLUIR</span>
                      </button>
                    </div>
                  </div>

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
              )}
            </div>

            {/* Items List */}
            {mealItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2 border-border">
                  <span className="text-[11px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                    ITENS ADICIONADOS
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-black">
                      {mealItems.length}
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
                  {mealItems.map((item) => (
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
                        onClick={() => handleRemoveItem(item.uid)}
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
            )}

            {/* Empty state */}
            {mealItems.length === 0 && (
              <div className="text-center p-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-2 border-dashed border-border bg-secondary">
                NENHUM ALIMENTO INCLUÍDO AINDA. BUSQUE E ADICIONE ACIMA.
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t-2 border-border bg-background gap-4 shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {mealItems.length > 0 ? (
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
                className="flex-1 sm:flex-none px-6 py-3 font-black uppercase tracking-widest text-xs text-foreground bg-background border-2 border-border hover:bg-secondary transition-colors focus:outline-none focus:border-primary disabled:opacity-50"
              >
                CANCELAR
              </button>

              <button
                type="submit"
                disabled={mealItems.length === 0 || isSubmitting}
                className="flex-1 sm:flex-none px-8 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-foreground shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>SALVANDO...</span>
                  </>
                ) : (
                  <>
                    <Utensils className="w-4 h-4" aria-hidden="true" />
                    <span>{mealToEdit ? 'SALVAR' : 'CRIAR REFEIÇÃO'}</span>
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
