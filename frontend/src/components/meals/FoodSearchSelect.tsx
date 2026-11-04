import React, { createContext, useContext } from 'react';
import Select, { components, type MenuListProps, type NoticeProps } from 'react-select';
import { Loader2 } from 'lucide-react';
import type { Food } from '../../services/food.service';
import type { FoodOption } from '../../types/meal-modal';

interface FoodSearchSelectProps {
  options: FoodOption[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
  isFetchNextPageError: boolean;
  onLoadMore: () => void;
  onSearchChange: (val: string) => void;
  onSelectFood: (food: Food) => void;
  /** Abre o cadastro com o termo buscado; só é oferecido durante uma busca. */
  onCreateFood?: (term: string) => void;
}

interface FoodPagination {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onLoadMore: () => void;
  onCreateFood?: (term: string) => void;
}

const FoodPaginationContext = createContext<FoodPagination | null>(null);

// A identidade do componente precisa ser estável para preservar o scroll do menu.
const FoodMenuList: React.FC<MenuListProps<FoodOption, false>> = (props) => {
  const pagination = useContext(FoodPaginationContext);
  const term = props.selectProps.inputValue.trim();
  const canCreate =
    Boolean(pagination?.onCreateFood) && term.length >= 2 && !props.selectProps.isLoading;

  return (
    <components.MenuList
      {...props}
      innerProps={{
        ...props.innerProps,
        onScroll: (event) => {
          props.innerProps.onScroll?.(event);
          const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
          if (
            scrollHeight - scrollTop - clientHeight <= 48 &&
            pagination?.hasNextPage &&
            !pagination.isFetchingNextPage &&
            !pagination.isFetchNextPageError
          ) {
            pagination.onLoadMore();
          }
        },
      }}
    >
      {props.children}
      {pagination?.isFetchingNextPage && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest text-primary-ink bg-secondary border-t-2 border-border"
        >
          <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
          CARREGANDO ALIMENTOS...
        </div>
      )}
      {pagination?.isFetchNextPageError && (
        <div className="p-3 border-t-2 border-border">
          <p role="alert" className="text-xs font-bold uppercase text-destructive">
            ERRO AO CARREGAR MAIS ALIMENTOS.
          </p>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.preventDefault();
              pagination.onLoadMore();
            }}
            className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-center text-primary-ink bg-secondary border-t-2 border-border hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            TENTAR NOVAMENTE
          </button>
        </div>
      )}
      {canCreate && (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            pagination?.onCreateFood?.(term);
          }}
          className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-t-2 border-border hover:bg-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          NÃO ACHOU?{' '}
          <span className="text-primary-ink underline underline-offset-2">
            CADASTRAR “{term.toUpperCase()}”
          </span>
        </button>
      )}
    </components.MenuList>
  );
};

// Linhas no formato das opções (py-3, texto 10px) enquanto a primeira página carrega.
const FoodLoadingSkeleton: React.FC<NoticeProps<FoodOption, false>> = () => (
  <div role="status">
    <span className="sr-only">CARREGANDO ALIMENTOS...</span>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} aria-hidden="true" className="px-4 py-3">
        <div className="h-[15px] bg-muted" style={{ width: `${70 - i * 12}%` }} />
      </div>
    ))}
  </div>
);

export const FoodSearchSelect: React.FC<FoodSearchSelectProps> = ({
  options,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  isError,
  isFetchNextPageError,
  onLoadMore,
  onSearchChange,
  onSelectFood,
  onCreateFood,
}) => {
  return (
    <FoodPaginationContext.Provider
      value={{ hasNextPage, isFetchingNextPage, isFetchNextPageError, onLoadMore, onCreateFood }}
    >
      <div data-no-swipe>
        <label htmlFor="food-select-input" className="sr-only">
          PESQUISAR ALIMENTO
        </label>
        <Select<FoodOption, false>
          inputId="food-select-input"
          aria-label="Pesquisar alimento no catálogo"
          options={options}
          isLoading={isLoading}
          onInputChange={(newValue, { action }) => {
            if (action === 'input-change') onSearchChange(newValue);
          }}
          onChange={(option) => {
            if (option) onSelectFood(option.food);
          }}
          onMenuScrollToBottom={() => {
            if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) onLoadMore();
          }}
          placeholder="PESQUISAR ALIMENTO..."
          menuPortalTarget={document.body}
          menuShouldScrollIntoView={false}
          noOptionsMessage={() =>
            isError ? 'ERRO AO CARREGAR ALIMENTOS. TENTE NOVAMENTE.' : 'NENHUM ALIMENTO ENCONTRADO'
          }
          components={{
            MenuList: FoodMenuList,
            LoadingMessage: FoodLoadingSkeleton,
            // Busca sem animação: o skeleton do menu já indica o carregamento.
            LoadingIndicator: () => null,
          }}
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          classNames={{
            control: (state) =>
              `bg-background border-2 border-border rounded-none text-base md:text-xs font-black shadow-none min-h-[48px] uppercase ${
                state.isFocused ? 'border-ring' : 'hover:border-foreground'
              }`,
            input: () => 'text-foreground py-0.5 uppercase text-base md:text-xs',
            singleValue: () => 'text-foreground uppercase',
            menu: () =>
              'bg-card border-2 border-border rounded-none shadow-hard mt-2 overflow-hidden',
            option: (state) =>
              `px-4 py-3 cursor-pointer text-[10px] font-bold uppercase tracking-widest ${
                state.isFocused
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary'
              }`,
            noOptionsMessage: () =>
              'text-muted-foreground p-4 text-[10px] font-bold uppercase tracking-widest text-center',
            placeholder: () => 'text-muted-foreground px-1 uppercase',
            menuList: () => 'p-0',
            valueContainer: () => 'px-4',
            dropdownIndicator: () => 'p-2 text-muted-foreground hover:text-foreground',
            indicatorSeparator: () => 'hidden',
            clearIndicator: () => 'p-2 text-muted-foreground hover:text-foreground',
          }}
          unstyled
        />
      </div>
    </FoodPaginationContext.Provider>
  );
};
