import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Flame, Plus, Utensils, Droplets, Beef, Clock, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { NewMealModal } from '../../components/meals/NewMealModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTodayMeals, deleteMeal, type Meal } from '../../services/meal.service';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [isNewMealModalOpen, setIsNewMealModalOpen] = React.useState(false);
  const [mealToEdit, setMealToEdit] = React.useState<Meal | null>(null);
  
  const [mealToDelete, setMealToDelete] = React.useState<Meal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  const { data: todayMeals = [], isLoading } = useQuery({
    queryKey: ['todayMeals'],
    queryFn: () => getTodayMeals(),
  });

  const deleteMealMutation = useMutation({
    mutationFn: deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayMeals'] });
      setIsDeleteModalOpen(false);
      setMealToDelete(null);
    }
  });

  const dailyCaloriesGoal = user?.daily_calories_goal || 2000;
  const dailyProteinsGoal = user?.daily_proteins_goal || 100;

  const consumedCalories = todayMeals.reduce((acc, meal) => acc + (meal.total_calories || 0), 0);
  const consumedProteins = todayMeals.reduce((acc, meal) => acc + (meal.total_proteins || 0), 0);

  const caloriesPercent = Math.min((consumedCalories / dailyCaloriesGoal) * 100, 100);
  const proteinsPercent = Math.min((consumedProteins / dailyProteinsGoal) * 100, 100);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Greeting */}
      <div className="pb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-0.5">
          Painel do Dia
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
          Olá, {user?.name?.split(' ')[0] || 'Usuário'}! 👋
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Objetivo: <strong className="text-zinc-700 dark:text-zinc-300 capitalize">{user?.goal?.replace(/_/g, ' ') || 'perder peso'}</strong>
        </p>
      </div>

      {/* Daily Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Calories Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Metas de Calorias</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Flame className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">{consumedCalories} / {dailyCaloriesGoal}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1.5">kcal</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${caloriesPercent}%` }} />
          </div>
        </div>

        {/* Proteins Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Meta de Proteínas</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
              <Beef className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">{consumedProteins} / {dailyProteinsGoal}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1.5">g</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-violet-500 h-2 rounded-full transition-all duration-500" style={{ width: `${proteinsPercent}%` }} />
          </div>
        </div>

        {/* Water Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Água Ingerida</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Droplets className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">1.8 / 2.5</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1.5">litros</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-blue-500 h-2 rounded-full w-[72%]" />
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Utensils className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Registrar Refeição</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Adicione café da manhã, almoço, jantar ou lanches.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setMealToEdit(null);
            setIsNewMealModalOpen(true);
          }}
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md text-sm flex items-center gap-2 min-h-[44px] transition-all"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Nova Refeição</span>
        </button>
      </div>

      {/* Meals List */}
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Refeições de Hoje</h3>
        
        {isLoading ? (
          <p className="text-sm text-zinc-500">Carregando refeições...</p>
        ) : todayMeals.length === 0 ? (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-8 text-center border border-zinc-200/50 dark:border-zinc-800/50">
            <Utensils className="w-8 h-8 mx-auto text-zinc-400 mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhuma refeição registrada hoje.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {todayMeals.map((meal) => (
              <div key={meal.id} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-zinc-900 dark:text-white capitalize">{meal.name}</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mr-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(meal.meal_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMealToEdit(meal);
                        setIsNewMealModalOpen(true);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Editar refeição"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMealToDelete(meal);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Excluir refeição"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4 space-y-1">
                  {meal.items.slice(0, 3).map((item, idx) => (
                    <p key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 shrink-0"></span>
                      <span className="truncate">{item.food_name}</span>
                      <span className="text-xs text-zinc-400 shrink-0 border-l border-zinc-200 dark:border-zinc-700 pl-2">
                        {Number(item.quantity)} {Number(item.quantity) === 1 ? 'porção' : 'porções'}
                      </span>
                    </p>
                  ))}
                  {meal.items.length > 3 && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500 pt-1">
                      + {meal.items.length - 3} outro(s) alimento(s)...
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-semibold">
                    <Flame className="w-4 h-4" />
                    <span>{meal.total_calories} kcal</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-semibold">
                    <Beef className="w-4 h-4" />
                    <span>{meal.total_proteins}g prot</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewMealModal
        isOpen={isNewMealModalOpen}
        onClose={() => {
          setIsNewMealModalOpen(false);
          setMealToEdit(null);
        }}
        mealToEdit={mealToEdit}
      />

      {/* Delete Meal Confirm Modal */}
      {isDeleteModalOpen && mealToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Excluir Refeição
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Tem certeza de que deseja excluir a refeição <strong className="text-zinc-900 dark:text-zinc-200">{mealToDelete.name}</strong>? Essa ação não pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setMealToDelete(null);
                }}
                disabled={deleteMealMutation.isPending}
                className="px-4 py-2 font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteMealMutation.mutate(mealToDelete.id)}
                disabled={deleteMealMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteMealMutation.isPending ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
