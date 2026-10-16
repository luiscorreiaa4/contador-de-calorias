import React from 'react';
import Select, { components, type MenuListProps } from 'react-select';
import type { Food } from '../../services/food.service';
import type { FoodOption } from '../../types/meal-modal';

interface FoodSearchSelectProps {
  options: FoodOption[];
  isLoading: boolean;
  onSearchChange: (val: string) => void;
  onSelectFood: (food: Food) => void;
}

const CustomMenuList = (props: MenuListProps<FoodOption, false>) => {
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

export const FoodSearchSelect: React.FC<FoodSearchSelectProps> = ({
  options,
  isLoading,
  onSearchChange,
  onSelectFood,
}) => {
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
        placeholder="PESQUISAR ALIMENTO..."
        menuPortalTarget={document.body}
        noOptionsMessage={() => 'NENHUM ALIMENTO ENCONTRADO'}
        components={{ MenuList: CustomMenuList }}
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
