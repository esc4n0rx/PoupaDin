// types/transaction.ts

import { CategoryType } from './category';

/**
 * Transaction Types
 */

export interface Transaction {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType; // 'expense' ou 'income'
  amount: number;
  date: string; // ISO format YYYY-MM-DD
  category_id: string;
  income_category_id?: string; // Fonte (apenas para despesas)
  observation?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
  };
  income_category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

export interface CreateTransactionDTO {
  name: string;
  type: CategoryType;
  amount: number;
  date: string; // ISO format YYYY-MM-DD
  category_id: string;
  income_category_id?: string;
  observation?: string;
}

export interface UpdateTransactionDTO {
  name?: string;
  amount?: number;
  date?: string;
  category_id?: string;
  income_category_id?: string;
  observation?: string;
}

export interface DaySummary {
  date: string;
  total_income: number;
  total_expense: number;
  balance: number; // total_income - total_expense
  transactions_count: number;
}

export interface BudgetValidation {
  isValid: boolean;
  budget_amount?: number;
  spent_amount?: number;
  remaining_amount?: number;
  would_exceed?: boolean;
  error_message?: string;
}