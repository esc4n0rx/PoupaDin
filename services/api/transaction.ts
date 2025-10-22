// services/api/transaction.ts

import { ApiResponse } from '../../types/api';
import {
    BudgetValidation,
    CreateTransactionDTO,
    DaySummary,
    Transaction,
    TransactionWithCategory,
    UpdateTransactionDTO,
} from '../../types/transaction';
import { supabase } from '../supabase';

export const TransactionAPI = {
  /**
   * Listar todas as transações do usuário
   */
  getTransactions: async (): Promise<ApiResponse<Transaction[]>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Get transactions error:', error);
        return {
          success: false,
          error: 'Erro ao buscar transações',
        };
      }

      return {
        success: true,
        data: data as Transaction[],
      };
    } catch (error) {
      console.error('Get transactions error:', error);
      return {
        success: false,
        error: 'Erro ao buscar transações',
      };
    }
  },

  /**
   * Listar transações de uma data específica
   */
  getTransactionsByDate: async (
    date: string
  ): Promise<ApiResponse<TransactionWithCategory[]>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories!transactions_category_id_fkey (
            id,
            name,
            icon,
            color,
            type
          ),
          income_category:categories!transactions_income_category_id_fkey (
            id,
            name,
            icon,
            color
          )
        `)
        .eq('user_id', user.id)
        .eq('date', date)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get transactions by date error:', error);
        return {
          success: false,
          error: 'Erro ao buscar transações',
        };
      }

      return {
        success: true,
        data: data as TransactionWithCategory[],
      };
    } catch (error) {
      console.error('Get transactions by date error:', error);
      return {
        success: false,
        error: 'Erro ao buscar transações',
      };
    }
  },

  /**
   * Calcular resumo do dia
   */
  getDaySummary: async (date: string): Promise<ApiResponse<DaySummary>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)
        .eq('date', date);

      if (error) {
        console.error('Get day summary error:', error);
        return {
          success: false,
          error: 'Erro ao calcular resumo',
        };
      }

      const transactions = data || [];
      const total_income = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const total_expense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const summary: DaySummary = {
        date,
        total_income,
        total_expense,
        balance: total_income - total_expense,
        transactions_count: transactions.length,
      };

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      console.error('Get day summary error:', error);
      return {
        success: false,
        error: 'Erro ao calcular resumo',
      };
    }
  },

  /**
   * Validar orçamento antes de criar despesa
   */
  validateBudget: async (
    category_id: string,
    amount: number,
    date: string
  ): Promise<ApiResponse<BudgetValidation>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const transactionDate = new Date(date);
      const year = transactionDate.getFullYear();
      const month = transactionDate.getMonth() + 1;

      // Buscar orçamento da categoria para o mês específico
      const { data: budget, error } = await supabase
        .from('category_budgets')
        .select('budget_amount, spent_amount')
        .eq('category_id', category_id)
        .eq('year', year)
        .eq('month', month)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Validate budget error:', error);
        return {
          success: false,
          error: 'Erro ao validar orçamento',
        };
      }

      // Se não há orçamento definido, permitir
      if (!budget || !budget.budget_amount) {
        return {
          success: true,
          data: {
            isValid: true,
          },
        };
      }

      const spent_amount = budget.spent_amount || 0;
      const budget_amount = budget.budget_amount;
      const remaining_amount = budget_amount - spent_amount;
      const would_exceed = spent_amount + amount > budget_amount;

      const validation: BudgetValidation = {
        isValid: !would_exceed,
        budget_amount,
        spent_amount,
        remaining_amount,
        would_exceed,
      };

      if (would_exceed) {
        validation.error_message = `Esta despesa de R$ ${amount.toFixed(
          2
        )} ultrapassaria o orçamento. Você já gastou R$ ${spent_amount.toFixed(
          2
        )} de R$ ${budget_amount.toFixed(2)} neste mês.`;
      }

      return {
        success: true,
        data: validation,
      };
    } catch (error) {
      console.error('Validate budget error:', error);
      return {
        success: false,
        error: 'Erro ao validar orçamento',
      };
    }
  },

  /**
   * Criar nova transação
   */
  createTransaction: async (
    data: CreateTransactionDTO
  ): Promise<ApiResponse<Transaction>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      // Validação: se for despesa, validar orçamento
      if (data.type === 'expense') {
        const validation = await TransactionAPI.validateBudget(
          data.category_id,
          data.amount,
          data.date
        );

        if (!validation.success) {
          return {
            success: false,
            error: validation.error,
          };
        }

        if (validation.data && !validation.data.isValid) {
          return {
            success: false,
            error: validation.data.error_message || 'Orçamento excedido',
          };
        }
      }

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          name: data.name,
          type: data.type,
          amount: data.amount,
          date: data.date,
          category_id: data.category_id,
          income_category_id: data.income_category_id || null,
          observation: data.observation || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Create transaction error:', error);
        
        // Tratar erro de orçamento excedido do trigger
        if (error.message.includes('Orçamento excedido')) {
          return {
            success: false,
            error: error.message,
          };
        }

        return {
          success: false,
          error: 'Erro ao criar transação',
        };
      }

      return {
        success: true,
        data: transaction as Transaction,
      };
    } catch (error) {
      console.error('Create transaction error:', error);
      return {
        success: false,
        error: 'Erro ao criar transação',
      };
    }
  },

  /**
   * Atualizar transação
   */
  updateTransaction: async (
    id: string,
    data: UpdateTransactionDTO
  ): Promise<ApiResponse<Transaction>> => {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .update({
          name: data.name,
          amount: data.amount,
          date: data.date,
          category_id: data.category_id,
          income_category_id: data.income_category_id,
          observation: data.observation,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update transaction error:', error);
        return {
          success: false,
          error: 'Erro ao atualizar transação',
        };
      }

      return {
        success: true,
        data: transaction as Transaction,
      };
    } catch (error) {
      console.error('Update transaction error:', error);
      return {
        success: false,
        error: 'Erro ao atualizar transação',
      };
    }
  },

  /**
   * Deletar transação
   */
  deleteTransaction: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete transaction error:', error);
        return {
          success: false,
          error: 'Erro ao deletar transação',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Delete transaction error:', error);
      return {
        success: false,
        error: 'Erro ao deletar transação',
      };
    }
  },

  /**
   * Buscar transação por ID
   */
  getTransactionById: async (
    id: string
  ): Promise<ApiResponse<TransactionWithCategory>> => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories!transactions_category_id_fkey (
            id,
            name,
            icon,
            color,
            type
          ),
          income_category:categories!transactions_income_category_id_fkey (
            id,
            name,
            icon,
            color
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Get transaction by id error:', error);
        return {
          success: false,
          error: 'Transação não encontrada',
        };
      }

      return {
        success: true,
        data: data as TransactionWithCategory,
      };
    } catch (error) {
      console.error('Get transaction by id error:', error);
      return {
        success: false,
        error: 'Erro ao buscar transação',
      };
    }
  },
};