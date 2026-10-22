export interface Food {
  id: string;
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  base_unit: 'g' | 'ml';
  serving_weight: number;
  unit_name?: string | null;
  unit_weight?: number | null;
  source?: string | null;
  source_ref?: string | null;
  active?: boolean;
  admin_edited_at?: string | null;
}
