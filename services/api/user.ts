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

  /**
   * Deletar conta do usuário e todos os dados associados
   */
  deleteAccount: async (email: string, password: string): Promise<ApiResponse<void>> => {
    try {
      // Primeiro, validar credenciais tentando fazer login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        return {
          success: false,
          error: 'Email ou senha incorretos',
        };
      }

      const userId = authData.user.id;

      // Deletar dados em cascata (Supabase deve ter CASCADE configurado, mas fazemos manualmente para garantir)
      // 1. Deletar transações
      await supabase.from('transactions').delete().eq('user_id', userId);

      // 2. Deletar metas
      await supabase.from('goals').delete().eq('user_id', userId);

      // 3. Deletar categorias
      await supabase.from('categories').delete().eq('user_id', userId);

      // 4. Deletar usuário da tabela users
      const { error: deleteUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteUserError) {
        console.error('Error deleting user from users table:', deleteUserError);
      }

      // 5. Deletar usuário do Supabase Auth
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

      if (deleteAuthError) {
        // Tentar deletar via RPC ou método alternativo
        // Se não temos acesso admin, fazer logout do usuário
        await supabase.auth.signOut();
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      console.error('Delete account error:', error);
      return {
        success: false,
        error: 'Erro ao deletar conta. Tente novamente.',
      };
    }
  },
};