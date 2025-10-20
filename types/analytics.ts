// types/analytics.ts

import { CategoryType } from './category';

export type AnalyticsViewType = 'income_flow' | 'expense_flow' | 'income_overview' | 'expense_overview';

export interface DailyFlow {
  date: string; // YYYY-MM-DD
  amount: number;
  accumulated: number;
}

export interface CategoryOverview {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
}

export interface MonthlyAnalytics {
  year: number;
  month: number;
  type: CategoryType;
  total_amount: number;
  daily_flow: DailyFlow[];
  category_overview: CategoryOverview[];
}

export interface TransactionsByDay {
  date: string;
  day_name: string;
  total: number;
  transactions: {
    id: string;
    name: string;
    amount: number;
    category_name: string;
    category_color: string;
    category_icon: string;
  }[];
}