import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Flame, Plus, Utensils, Beef, Clock, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const NewMealModal = React.lazy(() =>
  import('../../components/meals/NewMealModal').then((m) => ({
    default: m.NewMealModal,
  }))
);
import { getTodayMeals, deleteMeal, type Meal } from '../../services/meal.service';
import { getActiveGoal } from '../../services/goals.service';
import { getLocalDateString, isValidLocalDateString, addDaysToDateString, parseLocalDateString } from '../../utils/date';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const params = useParams<{ date?: string }>();
  const { user } = useAuth();

  const today = getLocalDateString();
  const selectedDate = isValidLocalDateString(params.date) ? params.date : today;
  const isToday = selectedDate === today;

  const goToDate = (date: string) => {
    if (date === today) navigate('/');
    else navigate(`/diario/${date}`);
  };

  const [isNewMealModalOpen, setIsNewMealModalOpen] = React.useState(false);
  const [mealToEdit, setMealToEdit] = React.useState<Meal | null>(null);

  const [mealToDelete, setMealToDelete] = React.useState<Meal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  const {
    data: todayMeals,
    isLoading,
    isError,
    error,
    refetch: refetchMeals,
  } = useQuery({
    queryKey: ['todayMeals', selectedDate],
    queryFn: ({ signal }) => getTodayMeals(selectedDate, signal),
    staleTime: 1000 * 60 * 5, // 5 minutos de cache (evita redundância)
  });

  const meals = todayMeals || [];

  // Buscar meta do dia
  const { data: activeGoal } = useQuery({
    queryKey: ['active-goal', selectedDate],
    queryFn: () => getActiveGoal(selectedDate),
  });

  const deleteMealMutation = useMutation({
    mutationFn: deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayMeals'] });
      queryClient.invalidateQueries({ queryKey: ['mealStats'] });
      setIsDeleteModalOpen(false);
      setMealToDelete(null);
    }
  });

  // Metas do dia
  const dailyCaloriesGoal = Number(activeGoal?.calories) || Number(user?.daily_calories_goal) || 2000;
  const dailyProteinsGoal = Number(activeGoal?.proteins) || Number(user?.daily_proteins_goal) || 100;
  // Fallbacks if not set
  const dailyCarbsGoal = Number(activeGoal?.carbs) || 250;
  const dailyFatsGoal = Number(activeGoal?.fats) || 65;

  const consumedCalories = meals.reduce((acc, meal) => acc + Number(meal.total_calories || 0), 0);
  const consumedProteins = meals.reduce((acc, meal) => acc + Number(meal.total_proteins || 0), 0);
  const consumedCarbs = meals.reduce((acc, meal) => acc + meal.items.reduce((sum, item) => sum + Number(item.carbs || 0), 0), 0);
  const consumedFats = meals.reduce((acc, meal) => acc + meal.items.reduce((sum, item) => sum + Number(item.fats || 0), 0), 0);

  const caloriesPercent = Math.min((consumedCalories / dailyCaloriesGoal) * 100, 100);
  const proteinsPercent = Math.min((consumedProteins / dailyProteinsGoal) * 100, 100);
  const carbsPercent = Math.min((consumedCarbs / dailyCarbsGoal) * 100, 100);
  const fatsPercent = Math.min((consumedFats / dailyFatsGoal) * 100, 100);

  const selectedDateLabel = parseLocalDateString(selectedDate).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const canGoNext = selectedDate < today;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Greeting */}
      <div className="border-b-2 border-border pb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
          Painel de Performance
        </p>
        <h1 className="text-3xl sm:text-5xl font-heading font-black text-foreground uppercase tracking-tighter">
          OLÁ, {user?.name?.split(' ')[0] || 'ATLETA'}!
        </h1>
        <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">
          FOCO ATUAL: <strong className="text-foreground">{user?.goal?.replace(/_/g, ' ') || 'ALTA PERFORMANCE'}</strong>
        </p>
      </div>

      {/* Navegação por Data */}
      <div className="bg-card border-2 border-border shadow-hard p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => goToDate(addDaysToDateString(selectedDate, -1))}
          aria-label="Dia anterior"
          className="w-full sm:w-auto px-4 py-2 border-2 border-border bg-background text-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-secondary transition-colors focus:outline-none focus:border-primary"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Dia anterior
        </button>

        <div className="flex flex-col items-center gap-1 text-center">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
            {isToday ? 'Hoje' : 'Diário'}
          </span>
          <span data-testid="dashboard-date" className="text-sm font-heading font-black uppercase tracking-tight text-foreground">
            {selectedDateLabel}
          </span>
          {!isToday && (
            <button
              type="button"
              onClick={() => goToDate(today)}
              className="text-[10px] font-bold uppercase tracking-widest text-primary underline underline-offset-2 hover:text-primary/80 focus:outline-none"
            >
              Voltar para hoje
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => goToDate(addDaysToDateString(selectedDate, 1))}
          disabled={!canGoNext}
          aria-label="Próximo dia"
          className="w-full sm:w-auto px-4 py-2 border-2 border-border bg-background text-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-secondary transition-colors focus:outline-none focus:border-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background"
        >
          Próximo dia
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Daily Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Calories Card */}
        <div className="bg-card border-2 border-border p-5 shadow-hard flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Calorias</span>
            <Flame className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-heading font-black text-foreground tracking-tighter">{consumedCalories.toFixed(0)}</span>
              <span className="text-sm font-bold text-muted-foreground">/{dailyCaloriesGoal.toFixed(0)}</span>
            </div>
          </div>
          <div className="w-full bg-background border-2 border-border h-3 mt-4 overflow-hidden">
            <div className="bg-primary h-full transition-all duration-500" style={{ width: `${caloriesPercent}%` }} />
          </div>
        </div>

        {/* Proteins Card */}
        <div className="bg-card border-2 border-border p-5 shadow-hard flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Proteínas</span>
            <Beef className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-heading font-black text-foreground tracking-tighter">{consumedProteins.toFixed(0)}</span>
              <span className="text-sm font-bold text-muted-foreground">/{dailyProteinsGoal.toFixed(0)}g</span>
            </div>
          </div>
          <div className="w-full bg-background border-2 border-border h-3 mt-4 overflow-hidden">
            <div className="bg-primary h-full transition-all duration-500" style={{ width: `${proteinsPercent}%` }} />
          </div>
        </div>

        {/* Carbs Card */}
        <div className="bg-card border-2 border-border p-5 shadow-hard flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Carboidratos</span>
            <div className="w-5 h-5 flex items-center justify-center font-bold text-primary bg-primary/10 border border-primary/20">C</div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-heading font-black text-foreground tracking-tighter">{consumedCarbs.toFixed(0)}</span>
              <span className="text-sm font-bold text-muted-foreground">/{dailyCarbsGoal.toFixed(0)}g</span>
            </div>
          </div>
          <div className="w-full bg-background border-2 border-border h-3 mt-4 overflow-hidden">
            <div className="bg-primary h-full transition-all duration-500" style={{ width: `${carbsPercent}%` }} />
          </div>
        </div>

        {/* Fats Card */}
        <div className="bg-card border-2 border-border p-5 shadow-hard flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Gorduras</span>
            <div className="w-5 h-5 flex items-center justify-center font-bold text-primary bg-primary/10 border border-primary/20">G</div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-heading font-black text-foreground tracking-tighter">{consumedFats.toFixed(0)}</span>
              <span className="text-sm font-bold text-muted-foreground">/{dailyFatsGoal.toFixed(0)}g</span>
            </div>
          </div>
          <div className="w-full bg-background border-2 border-border h-3 mt-4 overflow-hidden">
            <div className="bg-primary h-full transition-all duration-500" style={{ width: `${fatsPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="bg-background border-2 border-border p-6 shadow-hard flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
          <Utensils className="w-48 h-48" />
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-primary text-primary-foreground">
            <Utensils className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-black uppercase text-foreground">Registrar Refeição</h2>
            <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mt-1">Adicione o combustível da sua máquina.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setMealToEdit(null);
            setIsNewMealModalOpen(true);
          }}
          className="relative z-10 w-full sm:w-auto py-3 px-6 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all border-2 border-transparent focus:outline-none focus:border-foreground"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Nova Refeição</span>
        </button>
      </div>

      {/* Meals List */}
      <div className="space-y-6 pt-4">
        <h3 className="text-xl font-heading font-black text-foreground uppercase tracking-tight flex items-center gap-2">
          {isToday ? 'Refeições de Hoje' : 'Refeições do Dia'}
          <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5">{meals.length}</span>
        </h3>

        {isLoading ? (
          <div className="bg-card border-2 border-border border-dashed p-8 text-center flex items-center justify-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
              CARREGANDO REFEIÇÕES...
            </p>
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="bg-destructive/10 border-2 border-destructive p-6 shadow-hard flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive shrink-0" aria-hidden="true" />
              <div>
                <h4 className="text-sm font-heading font-black text-destructive uppercase tracking-wide">
                  ERRO AO CARREGAR REFEIÇÕES
                </h4>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                  {error instanceof Error ? error.message : 'NÃO FOI POSSÍVEL CARREGAR SUAS REFEIÇÕES HOJE.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => refetchMeals()}
              className="px-4 py-2 border-2 border-destructive bg-destructive text-destructive-foreground font-black uppercase text-xs tracking-widest hover:opacity-90 focus:outline-none"
            >
              TENTAR NOVAMENTE
            </button>
          </div>
        ) : meals.length === 0 ? (
          <div className="bg-card border-2 border-border border-dashed p-12 text-center flex flex-col items-center justify-center">
            <Utensils className="w-10 h-10 text-muted-foreground mb-4 opacity-50" aria-hidden="true" />
            <p className="text-sm font-heading font-black uppercase tracking-tight text-foreground mb-1">
              {isToday ? 'NENHUMA REFEIÇÃO REGISTRADA HOJE' : 'NENHUMA REFEIÇÃO REGISTRADA NESTE DIA'}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              ADICIONE SUA PRIMEIRA REFEIÇÃO ACIMA PARA ACOMPANHAR SEUS MACROS.
            </p>
            <button
              type="button"
              onClick={() => {
                setMealToEdit(null);
                setIsNewMealModalOpen(true);
              }}
              className="py-2.5 px-5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all border-2 border-transparent focus:outline-none"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>REGISTRAR REFEIÇÃO</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meals.map((meal) => (
              <div key={meal.id} className="bg-card border-2 border-border p-5 hover:shadow-hard transition-shadow flex flex-col justify-between group">
                <div>
                  <div className="flex items-start justify-between mb-4 border-b-2 border-border pb-4">
                    <div>
                      <h4 className="font-heading font-black text-lg text-foreground uppercase tracking-tighter">{meal.name}</h4>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(meal.meal_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setMealToEdit(meal);
                          setIsNewMealModalOpen(true);
                        }}
                        className="p-2 border-2 border-border bg-background text-foreground hover:bg-primary hover:text-primary-foreground transition-colors focus:outline-none"
                        title="Editar refeição"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMealToDelete(meal);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 border-2 border-border bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors focus:outline-none"
                        title="Excluir refeição"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {meal.items.slice(0, 3).map((item, idx) => {
                      let formattedQuantity = `${Math.round(Number(item.quantity))} g`;
                      if (item.unit === 'un' && item.display_amount) {
                        const unitLabel = item.food_unit_name || 'un';
                        const label = Number(item.display_amount) === 1 ? unitLabel : `${unitLabel}s`;
                        formattedQuantity = `${item.display_amount} ${label} (${Math.round(Number(item.quantity))}g)`;
                      } else if (item.unit === 'ml' || item.food_base_unit === 'ml') {
                        formattedQuantity = `${Math.round(Number(item.quantity))} ml`;
                      }

                      return (
                        <p key={idx} className="text-xs font-bold text-foreground flex items-center justify-between">
                          <span className="truncate pr-4 uppercase">{item.food_name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0 bg-background border-2 border-border px-1.5 py-0.5 tracking-wider">
                            {formattedQuantity}
                          </span>
                        </p>
                      );
                    })}
                    {meal.items.length > 3 && (
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest pt-2">
                        + {meal.items.length - 3} OUTROS ALIMENTOS...
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs pt-4 border-t-2 border-border mt-auto">
                  <div className="flex items-center gap-2 font-black text-foreground uppercase tracking-widest">
                    <Flame className="w-4 h-4 text-primary" />
                    <span>{Number(meal.total_calories).toFixed(0)} KCAL</span>
                  </div>
                  <div className="flex items-center gap-2 font-black text-foreground uppercase tracking-widest">
                    <Beef className="w-4 h-4 text-primary" />
                    <span>{Number(meal.total_proteins).toFixed(0)}G PROT</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isNewMealModalOpen && (
        <React.Suspense fallback={null}>
          <NewMealModal
            isOpen={isNewMealModalOpen}
            onClose={() => {
              setIsNewMealModalOpen(false);
              setMealToEdit(null);
            }}
            mealToEdit={mealToEdit}
            mealDate={selectedDate}
          />
        </React.Suspense>
      )}

      {/* Delete Meal Confirm Modal */}
      {isDeleteModalOpen && mealToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-card border-2 border-border shadow-hard overflow-hidden"
          >
            <div className="p-6 border-b-2 border-border">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-destructive text-destructive-foreground shrink-0 border-2 border-transparent">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-black text-foreground uppercase tracking-tight mb-2">
                    EXCLUIR REFEIÇÃO
                  </h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                    VOCÊ VAI DELETAR: <strong className="text-foreground">{mealToDelete.name}</strong>. ESSA AÇÃO NÃO PODE SER DESFEITA.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 p-4 bg-background">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setMealToDelete(null);
                }}
                disabled={deleteMealMutation.isPending}
                className="px-4 py-2 font-bold uppercase tracking-widest text-xs text-foreground hover:bg-secondary transition-colors focus:outline-none focus:border-primary border-2 border-transparent"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteMealMutation.mutate(mealToDelete.id)}
                disabled={deleteMealMutation.isPending}
                className="px-6 py-2 bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-destructive/90 transition-colors focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 focus:ring-offset-background"
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
