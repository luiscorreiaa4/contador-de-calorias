import React from 'react';
import Select, { components, type MenuListProps } from 'react-select';
import { Loader2 } from 'lucide-react';
import type { Food } from '../../services/food.service';
import type { FoodOption } from '../../types/meal-modal';

interface FoodSearchSelectProps {
  options: FoodOption[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onSearchChange: (val: string) => void;
  onSelectFood: (food: Food) => void;
}

interface MenuListWithLoadMoreProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

/**
 * Paginação infinita: além do carregamento automático ao chegar ao fim
 * da lista (`onMenuScrollToBottom`), expõe um controle textual com feedback de
 * carregamento dentro do próprio menu.
 */
function createMenuList({ hasNextPage, isFetchingNextPage, onLoadMore }: MenuListWithLoadMoreProps) {
  const MenuListWithLoadMore: React.FC<MenuListProps<FoodOption, false>> = (props) => (
    <components.MenuList {...props}>
      {props.children}
      {hasNextPage && (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            onLoadMore();
          }}
          disabled={isFetchingNextPage}
          className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-center text-primary bg-secondary border-t-2 border-border hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
        >
          {isFetchingNextPage ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              CARREGANDO ALIMENTOS...
            </span>
          ) : (
            'CARREGAR MAIS ALIMENTOS'
          )}
        </button>
      )}
    </components.MenuList>
  );

  return MenuListWithLoadMore;
}

export const FoodSearchSelect: React.FC<FoodSearchSelectProps> = ({
  options,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onSearchChange,
  onSelectFood,
}) => {
  const menuListComponent = React.useMemo(
    () => createMenuList({ hasNextPage, isFetchingNextPage, onLoadMore }),
    [hasNextPage, isFetchingNextPage, onLoadMore]
  );

  return (
    <>
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
          if (hasNextPage && !isFetchingNextPage) onLoadMore();
        }}
        placeholder="PESQUISAR ALIMENTO..."
        menuPortalTarget={document.body}
        noOptionsMessage={() => 'NENHUM ALIMENTO ENCONTRADO'}
        components={{ MenuList: menuListComponent }}
        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
        classNames={{
          control: (state) =>
            `bg-background border-2 border-border rounded-none text-xs font-black shadow-none transition-colors min-h-[48px] uppercase ${
              state.isFocused ? 'border-primary' : 'hover:border-primary/50'
            }`,
          input: () => 'text-foreground py-0.5 uppercase',
          singleValue: () => 'text-foreground uppercase',
          menu: () => 'bg-card border-2 border-border rounded-none shadow-hard mt-2 overflow-hidden',
          option: (state) =>
            `px-4 py-3 cursor-pointer transition-colors text-[10px] font-bold uppercase tracking-widest ${
              state.isFocused ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'
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
    </>
  );
};
