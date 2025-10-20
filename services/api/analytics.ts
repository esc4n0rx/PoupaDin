// services/api/analytics.ts

import { MonthlyAnalytics, TransactionsByDay } from '@/types/analytics';
import { ApiResponse } from '@/types/api';
import { CategoryType } from '@/types/category';
import { supabase } from '../supabase';

export const AnalyticsAPI = {
  /**
   * Buscar análises mensais (flow + overview)
   */
  getMonthlyAnalytics: async (
    year: number,
    month: number,
    type: CategoryType
  ): Promise<ApiResponse<MonthlyAnalytics>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      // Buscar transações do mês
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          id,
          name,
          amount,
          date,
          category:categories!transactions_category_id_fkey (
            id,
            name,
            icon,
            color
          )
        `)
        .eq('user_id', user.id)
        .eq('type', type)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Get monthly analytics error:', error);
        return {
          success: false,
          error: 'Erro ao buscar análises',
        };
      }

      // Processar dados para flow diário
      const dailyFlowMap = new Map<string, number>();
      const categoryMap = new Map<string, {
        name: string;
        color: string;
        icon: string;
        amount: number;
        count: number;
      }>();

      let totalAmount = 0;

      transactions.forEach((t: any) => {
        const amount = Number(t.amount);
        totalAmount += amount;

        // Flow diário
        const currentAmount = dailyFlowMap.get(t.date) || 0;
        dailyFlowMap.set(t.date, currentAmount + amount);

        // Overview por categoria
        const categoryId = t.category.id;
        const existing = categoryMap.get(categoryId);
        if (existing) {
          existing.amount += amount;
          existing.count += 1;
        } else {
          categoryMap.set(categoryId, {
            name: t.category.name,
            color: t.category.color,
            icon: t.category.icon,
            amount: amount,
            count: 1,
          });
        }
      });

      // Gerar array de flow diário (todos os dias do mês)
      const daily_flow = [];
      let accumulated = 0;
      for (let day = 1; day <= lastDay; day++) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const amount = dailyFlowMap.get(date) || 0;
        accumulated += amount;
        daily_flow.push({
          date,
          amount,
          accumulated,
        });
      }

      // Gerar array de overview por categoria
      const category_overview = Array.from(categoryMap.entries()).map(([id, data]) => ({
        category_id: id,
        category_name: data.name,
        category_color: data.color,
        category_icon: data.icon,
        total_amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        transaction_count: data.count,
      })).sort((a, b) => b.total_amount - a.total_amount);

      return {
        success: true,
        data: {
          year,
          month,
          type,
          total_amount: totalAmount,
          daily_flow,
          category_overview,
        },
      };
    } catch (error) {
      console.error('Get monthly analytics error:', error);
      return {
        success: false,
        error: 'Erro ao buscar análises',
      };
    }
  },

  /**
   * Buscar transações agrupadas por dia
   */
  getTransactionsByDay: async (
    year: number,
    month: number,
    type: CategoryType
  ): Promise<ApiResponse<TransactionsByDay[]>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          id,
          name,
          amount,
          date,
          category:categories!transactions_category_id_fkey (
            id,
            name,
            icon,
            color
          )
        `)
        .eq('user_id', user.id)
        .eq('type', type)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        console.error('Get transactions by day error:', error);
        return {
          success: false,
          error: 'Erro ao buscar transações',
        };
      }

      // Agrupar por dia
      const groupedByDay = new Map<string, any[]>();

      transactions.forEach((t: any) => {
        const existing = groupedByDay.get(t.date) || [];
        existing.push({
          id: t.id,
          name: t.name,
          amount: Number(t.amount),
          category_name: t.category.name,
          category_color: t.category.color,
          category_icon: t.category.icon,
        });
        groupedByDay.set(t.date, existing);
      });

      // Converter para array
      const result: TransactionsByDay[] = Array.from(groupedByDay.entries()).map(([date, trans]) => {
        const dateObj = new Date(date + 'T12:00:00');
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        
        return {
          date,
          day_name: dayNames[dateObj.getDay()],
          total: trans.reduce((sum, t) => sum + t.amount, 0),
          transactions: trans,
        };
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Get transactions by day error:', error);
      return {
        success: false,
        error: 'Erro ao buscar transações',
      };
    }
  },
};