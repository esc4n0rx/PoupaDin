 // types/goal.ts

/**
 * Goal Types
 */

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount?: number; // Meta financeira (opcional)
  current_amount: number; // Valor acumulado
  color: string;
  icon: string;
  deadline?: string; // Data de vencimento (opcional) - ISO format
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalDTO {
  name: string;
  target_amount?: number;
  color: string;
  icon: string;
  deadline?: string;
}

export interface UpdateGoalDTO {
  name?: string;
  target_amount?: number;
  color?: string;
  icon?: string;
  deadline?: string;
  is_completed?: boolean;
}

export interface AddBalanceDTO {
  amount: number;
}

export interface GoalWithProgress extends Goal {
  progress_percentage?: number;
  remaining_amount?: number;
  days_remaining?: number;
  is_overdue?: boolean;
}