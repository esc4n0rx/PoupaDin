// types/category.ts

/**
 * Category Types
 */

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  monthly_budget?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryBudget {
  id: string;
  category_id: string;
  user_id: string;
  year: number;
  month: number;
  budget_amount: number;
  spent_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryDTO {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  monthly_budget?: number;
}

export interface UpdateCategoryDTO {
  name?: string;
  icon?: string;
  color?: string;
  monthly_budget?: number;
  is_active?: boolean;
}

export interface CategoryWithBudget extends Category {
  current_budget?: CategoryBudget;
  spent_amount?: number;
  remaining_amount?: number;
  budget_percentage?: number;
}