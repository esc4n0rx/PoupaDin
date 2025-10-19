// services/api/goal.ts

/**
 * Goal API Service
 */
import { ApiResponse } from '../../types/api';
import { AddBalanceDTO, CreateGoalDTO, Goal, GoalWithProgress, UpdateGoalDTO } from '../../types/goal';
import { supabase } from '../supabase';

export const GoalAPI = {
  /**
   * Listar objetivos do usuário com cálculo de progresso
   */
  getGoals: async (): Promise<ApiResponse<GoalWithProgress[]>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('is_completed', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get goals error:', error);
        return {
          success: false,
          error: 'Erro ao buscar objetivos',
        };
      }

      // Processar dados e calcular progresso
      const goalsWithProgress: GoalWithProgress[] = (goals || []).map((goal) => {
        const goalWithProgress: GoalWithProgress = { ...goal };

        // Calcular progresso se há meta definida
        if (goal.target_amount && goal.target_amount > 0) {
          goalWithProgress.progress_percentage = Math.min(
            (goal.current_amount / goal.target_amount) * 100,
            100
          );
          goalWithProgress.remaining_amount = Math.max(
            goal.target_amount - goal.current_amount,
            0
          );
        }

        // Calcular dias restantes se há prazo
        if (goal.deadline) {
          const today = new Date();
          const deadline = new Date(goal.deadline);
          const diffTime = deadline.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          goalWithProgress.days_remaining = diffDays;
          goalWithProgress.is_overdue = diffDays < 0 && !goal.is_completed;
        }

        return goalWithProgress;
      });

      return {
        success: true,
        data: goalsWithProgress,
      };
    } catch (error) {
      console.error('Get goals error:', error);
      return {
        success: false,
        error: 'Erro ao buscar objetivos',
      };
    }
  },

  /**
   * Buscar objetivo por ID
   */
  getGoalById: async (id: string): Promise<ApiResponse<Goal>> => {
    try {
      const { data: goal, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !goal) {
        return {
          success: false,
          error: 'Objetivo não encontrado',
        };
      }

      return {
        success: true,
        data: goal as Goal,
      };
    } catch (error) {
      console.error('Get goal error:', error);
      return {
        success: false,
        error: 'Erro ao buscar objetivo',
      };
    }
  },

  /**
   * Criar novo objetivo
   */
  createGoal: async (data: CreateGoalDTO): Promise<ApiResponse<Goal>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const { data: goal, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: data.name,
          target_amount: data.target_amount,
          current_amount: 0,
          color: data.color,
          icon: data.icon,
          deadline: data.deadline,
          is_completed: false,
        })
        .select()
        .single();

      if (error || !goal) {
        console.error('Create goal error:', error);
        return {
          success: false,
          error: 'Erro ao criar objetivo',
        };
      }

      return {
        success: true,
        data: goal as Goal,
      };
    } catch (error) {
      console.error('Create goal error:', error);
      return {
        success: false,
        error: 'Erro ao criar objetivo',
      };
    }
  },

  /**
   * Atualizar objetivo
   */
  updateGoal: async (id: string, updates: UpdateGoalDTO): Promise<ApiResponse<Goal>> => {
    try {
      const { data: goal, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error || !goal) {
        console.error('Update goal error:', error);
        return {
          success: false,
          error: 'Erro ao atualizar objetivo',
        };
      }

      return {
        success: true,
        data: goal as Goal,
      };
    } catch (error) {
      console.error('Update goal error:', error);
      return {
        success: false,
        error: 'Erro ao atualizar objetivo',
      };
    }
  },

  /**
   * Adicionar saldo ao objetivo
   */
  addBalance: async (id: string, data: AddBalanceDTO): Promise<ApiResponse<Goal>> => {
    try {
      // Buscar objetivo atual
      const { data: goal, error: fetchError } = await supabase
        .from('goals')
        .select('current_amount')
        .eq('id', id)
        .single();

      if (fetchError || !goal) {
        return {
          success: false,
          error: 'Objetivo não encontrado',
        };
      }

      const newAmount = (goal.current_amount || 0) + data.amount;

      // Atualizar saldo
      const { data: updatedGoal, error: updateError } = await supabase
        .from('goals')
        .update({ current_amount: newAmount })
        .eq('id', id)
        .select()
        .single();

      if (updateError || !updatedGoal) {
        console.error('Add balance error:', updateError);
        return {
          success: false,
          error: 'Erro ao adicionar saldo',
        };
      }

      return {
        success: true,
        data: updatedGoal as Goal,
      };
    } catch (error) {
      console.error('Add balance error:', error);
      return {
        success: false,
        error: 'Erro ao adicionar saldo',
      };
    }
  },

  /**
   * Deletar objetivo
   */
  deleteGoal: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete goal error:', error);
        return {
          success: false,
          error: 'Erro ao deletar objetivo',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Delete goal error:', error);
      return {
        success: false,
        error: 'Erro ao deletar objetivo',
      };
    }
  },
};