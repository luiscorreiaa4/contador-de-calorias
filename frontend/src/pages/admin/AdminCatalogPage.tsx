import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Power,
  RotateCcw,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Food, AdminCreateFoodDTO, AdminUpdateFoodDTO } from '@caloriesync/shared';
import {
  listAdminFoods,
  createAdminFood,
  updateAdminFood,
  updateAdminFoodStatus,
} from '../../services/admin-food.service';
import { AdminFoodModal } from '../../components/admin/AdminFoodModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const AdminCatalogPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [foodToToggleStatus, setFoodToToggleStatus] = useState<Food | null>(null);

  // Avisos de sucesso / warnings do servidor
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [apiWarnings, setApiWarnings] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    isPlaceholderData,
  } = useQuery({
    queryKey: ['adminFoods', searchTerm, activeFilter, page, limit],
    queryFn: () =>
      listAdminFoods({
        search: searchTerm.trim() || undefined,
        status: activeFilter,
        page,
        limit,
      }),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });

  const foods = data?.foods ?? [];
  const pagination = data?.pagination;

  // Mutação: Criar ou Editar
  const saveMutation = useMutation({
    mutationFn: async (payload: AdminCreateFoodDTO | AdminUpdateFoodDTO) => {
      if (editingFood) {
        return updateAdminFood(editingFood.id, payload as AdminUpdateFoodDTO);
      }
      return createAdminFood(payload as AdminCreateFoodDTO);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminFoods'] });
      queryClient.invalidateQueries({ queryKey: ['foods'] });
      setIsModalOpen(false);
      setEditingFood(null);
      setApiError(null);
      setFeedbackMessage(
        editingFood
          ? 'Alimento atualizado com sucesso no catálogo global!'
          : 'Novo alimento cadastrado com sucesso no catálogo global!'
      );
      if (res.warnings && res.warnings.length > 0) {
        setApiWarnings(res.warnings);
      } else {
        setApiWarnings([]);
      }
    },
  });

  // Mutação: Alternar Status (Ativar / Desativar)
  const statusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return updateAdminFoodStatus(id, active);
    },
    onSuccess: (updatedFood) => {
      queryClient.invalidateQueries({ queryKey: ['adminFoods'] });
      queryClient.invalidateQueries({ queryKey: ['foods'] });
      setFoodToToggleStatus(null);
      setApiError(null);
      setFeedbackMessage(
        updatedFood.active
          ? `Alimento "${updatedFood.name}" reativado no catálogo.`
          : `Alimento "${updatedFood.name}" desativado do catálogo global (B4).`
      );
      setApiWarnings([]);
    },
    onError: (err: Error) => {
      setApiError(err.message || 'Erro ao alterar status do alimento.');
      setFoodToToggleStatus(null);
    },
  });

  const handleOpenCreate = () => {
    setEditingFood(null);
    setApiError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (food: Food) => {
    setEditingFood(food);
    setApiError(null);
    setIsModalOpen(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Cabeçalho da Página */}
      <div className="border-2 border-border bg-card p-6 shadow-hard flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary text-primary-foreground border-2 border-black shrink-0 shadow-hard-fill">
            <Database className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-black text-foreground uppercase tracking-tight">
              Catálogo Global de Alimentos
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              Gestão e Curadoria Administrativa (D-22 / B1–B12)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest border-2 border-black shadow-hard-fill hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>+ Novo Alimento</span>
        </button>
      </div>

      {/* Alertas e Feedback */}
      {feedbackMessage && (
        <div
          role="status"
          className="p-4 bg-secondary border-2 border-border flex items-center justify-between gap-3 text-xs font-bold text-foreground uppercase tracking-wider"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary-ink shrink-0" aria-hidden="true" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-muted-foreground hover:text-foreground text-xs uppercase underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Fechar
          </button>
        </div>
      )}

      {apiWarnings.length > 0 && (
        <div
          role="alert"
          className="p-4 bg-secondary border-2 border-border space-y-1.5 text-xs font-bold text-foreground"
        >
          <div className="flex items-center gap-2 text-warning uppercase font-black">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />
            <span>Avisos de Divergência Calórica (B12):</span>
          </div>
          {apiWarnings.map((w, idx) => (
            <p key={idx} className="text-muted-foreground ml-6">
              {w}
            </p>
          ))}
        </div>
      )}

      {apiError && (
        <div
          role="alert"
          className="p-4 bg-destructive text-destructive-foreground font-bold text-xs uppercase tracking-wider border-2 border-transparent flex items-center justify-between"
        >
          <span>{apiError}</span>
          <button
            type="button"
            onClick={() => setApiError(null)}
            className="underline uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Controles de Busca e Filtro */}
      <div className="border-2 border-border bg-card p-4 shadow-hard flex flex-col md:flex-row gap-4 justify-between items-stretch">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <label htmlFor="admin-catalog-search" className="sr-only">
              Buscar alimentos no catálogo
            </label>
            <input
              id="admin-catalog-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="BUSCAR POR NOME OU CÓDIGO..."
              className="w-full pl-10 pr-3 py-2 text-xs font-mono uppercase bg-background border-2 border-border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-secondary text-foreground font-black text-xs uppercase tracking-wider border-2 border-border hover:bg-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
          >
            Buscar
          </button>
        </form>

        {/* Abas de Filtro de Status */}
        <div className="flex border-2 border-border p-1 bg-background shrink-0">
          {(
            [
              { id: 'all', label: 'TODOS' },
              { id: 'active', label: 'ATIVOS' },
              { id: 'inactive', label: 'DESATIVADOS' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeFilter === tab.id
                  ? 'bg-primary text-primary-foreground border-2 border-black shadow-hard-fill'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo da Tabela / Cartões */}
      <div className="border-2 border-border bg-card shadow-hard overflow-hidden">
        {isLoading && !isPlaceholderData ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-ink animate-spin" aria-hidden="true" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              CARREGANDO CATÁLOGO GLOBAL...
            </span>
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-2">
            <p className="font-black text-xs uppercase tracking-wider text-destructive">
              FALHA AO CARREGAR O CATÁLOGO: {(error as Error)?.message || 'Erro inesperado'}
            </p>
          </div>
        ) : foods.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="font-black text-xs uppercase tracking-widest text-muted-foreground">
              NENHUM ALIMENTO ENCONTRADO NO CATÁLOGO
            </p>
            <p className="text-xs text-muted-foreground">
              Ajuste o termo de busca ou o filtro de status selecionado.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-border bg-secondary text-[11px] font-black uppercase tracking-wider text-foreground">
                    <th scope="col" className="p-4">Alimento</th>
                    <th scope="col" className="p-4 text-right">Kcal</th>
                    <th scope="col" className="p-4 text-right">P / C / G (g)</th>
                    <th scope="col" className="p-4">Porção / Ref</th>
                    <th scope="col" className="p-4 text-center">Status</th>
                    <th scope="col" className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-border font-mono text-xs">
                  {foods.map((food) => (
                    <tr
                      key={food.id}
                      className={`hover:bg-secondary/40 transition-colors ${
                        !food.active ? 'opacity-65 bg-secondary/15' : ''
                      }`}
                    >
                      <td className="p-4 font-bold text-foreground">
                        <div className="truncate max-w-[240px] uppercase">{food.name}</div>
                        {food.admin_edited_at && (
                          <span className="text-[10px] text-primary-ink uppercase font-normal block">
                            [Curado]
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-black text-foreground">
                        {food.calories} kcal
                      </td>
                      <td className="p-4 text-right text-muted-foreground">
                        {food.proteins} / {food.carbs} / {food.fats}
                      </td>
                      <td className="p-4 text-muted-foreground text-[11px]">
                        <div>{food.serving_weight} {food.base_unit}</div>
                        {food.source_ref && (
                          <div className="truncate max-w-[160px] text-[10px] text-muted-foreground">
                            {food.source_ref}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-2 ${
                            food.active
                              ? 'bg-primary text-primary-foreground border-black'
                              : 'bg-secondary text-muted-foreground border-border'
                          }`}
                        >
                          {food.active ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(food)}
                            aria-label={`Editar ${food.name}`}
                            className="p-2 border-2 border-border bg-background text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFoodToToggleStatus(food)}
                            aria-label={food.active ? `Desativar ${food.name}` : `Reativar ${food.name}`}
                            className={`p-2 border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center ${
                              food.active
                                ? 'border-border bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive'
                                : 'border-border bg-background text-foreground hover:bg-secondary focus-visible:ring-ring'
                            }`}
                          >
                            {food.active ? (
                              <Power className="w-4 h-4" />
                            ) : (
                              <RotateCcw className="w-4 h-4 text-primary-ink" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y-2 divide-border">
              {foods.map((food) => (
                <div
                  key={food.id}
                  className={`p-4 space-y-3 ${
                    !food.active ? 'opacity-70 bg-secondary/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-heading font-black text-sm uppercase text-foreground truncate">
                        {food.name}
                      </h3>
                      {food.source_ref && (
                        <p className="text-[10px] text-muted-foreground uppercase truncate mt-0.5">
                          {food.source_ref}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-2 shrink-0 ${
                        food.active
                          ? 'bg-primary text-primary-foreground border-black'
                          : 'bg-secondary text-muted-foreground border-border'
                      }`}
                    >
                      {food.active ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </div>

                  {/* Nutrientes Mobile */}
                  <div className="grid grid-cols-4 gap-2 text-center p-2 bg-secondary border border-border text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-muted-foreground block uppercase">Kcal</span>
                      <span className="font-black text-foreground">{food.calories}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block uppercase">P (g)</span>
                      <span className="font-bold text-foreground">{food.proteins}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block uppercase">C (g)</span>
                      <span className="font-bold text-foreground">{food.carbs}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block uppercase">G (g)</span>
                      <span className="font-bold text-foreground">{food.fats}</span>
                    </div>
                  </div>

                  {/* Ações Mobile */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(food)}
                      className="px-4 py-2 border-2 border-border bg-background text-foreground font-black text-xs uppercase tracking-wider hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoodToToggleStatus(food)}
                      className={`px-4 py-2 border-2 font-black text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 min-h-[44px] flex items-center gap-1.5 ${
                        food.active
                          ? 'border-border bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive'
                          : 'border-border bg-background text-foreground hover:bg-secondary focus-visible:ring-ring'
                      }`}
                    >
                      {food.active ? (
                        <>
                          <Power className="w-3.5 h-3.5" />
                          <span>Desativar</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 text-primary-ink" />
                          <span>Reativar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {pagination && pagination.totalPages > 1 && (
              <div className="p-4 bg-background border-t-2 border-border flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
                <span className="text-muted-foreground uppercase text-[11px]">
                  Exibindo página <strong className="text-foreground">{pagination.page}</strong> de{' '}
                  <strong className="text-foreground">{pagination.totalPages}</strong> ({pagination.total} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1.5 border-2 border-border bg-background text-foreground uppercase tracking-wider font-bold hover:bg-secondary disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1.5 border-2 border-border bg-background text-foreground uppercase tracking-wider font-bold hover:bg-secondary disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] inline-flex items-center gap-1"
                  >
                    <span>Próxima</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      <AdminFoodModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFood(null);
        }}
        foodToEdit={editingFood}
        onSubmit={async (payload) => {
          await saveMutation.mutateAsync(payload);
        }}
        isLoading={saveMutation.isPending}
      />

      {/* Confirmação de Alteração de Status (B4) */}
      <ConfirmDialog
        isOpen={!!foodToToggleStatus}
        title={foodToToggleStatus?.active ? 'Desativar Alimento?' : 'Reativar Alimento?'}
        description={
          foodToToggleStatus?.active ? (
            <span>
              O alimento <strong>&quot;{foodToToggleStatus.name}&quot;</strong> deixará de aparecer em novas buscas, mas continuará preservado no histórico de refeições já lançadas (B4, B6).
            </span>
          ) : (
            <span>
              O alimento <strong>&quot;{foodToToggleStatus?.name}&quot;</strong> voltará a ficar disponível para inclusão no diário alimentar.
            </span>
          )
        }
        confirmLabel={foodToToggleStatus?.active ? 'Desativar Alimento' : 'Reativar Alimento'}
        variant={foodToToggleStatus?.active ? 'destructive' : 'primary'}
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (foodToToggleStatus) {
            statusMutation.mutate({
              id: foodToToggleStatus.id,
              active: !foodToToggleStatus.active,
            });
          }
        }}
        onCancel={() => setFoodToToggleStatus(null)}
      />
    </div>
  );
};
