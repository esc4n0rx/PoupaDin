/**
 * User API Service
 */
import { ApiResponse } from '../../types/api';
import { User } from '../../types/user';
import { supabase } from '../supabase';

export const UserAPI = {
  /**
   * Buscar dados do usuário por ID
   */
  getUserById: async (userId: string): Promise<ApiResponse<User>> => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, full_name, email, birth_date, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return {
          success: false,
          error: 'Usuário não encontrado',
        };
      }

      return {
        success: true,
        data: user as User,
      };
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        error: 'Erro ao buscar usuário',
      };
    }
  },

  /**
   * Atualizar dados do usuário
   */
  updateUser: async (userId: string, updates: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select('id, full_name, email, birth_date, created_at, updated_at')
        .single();

      if (error || !user) {
        return {
          success: false,
          error: 'Erro ao atualizar usuário',
        };
      }

      return {
        success: true,
        data: user as User,
      };
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        error: 'Erro ao atualizar usuário',
      };
    }
  },
};