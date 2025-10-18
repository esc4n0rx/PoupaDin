/**
 * Authentication API Service
 */

import { ApiResponse } from '@/types/api';
import {
    AuthResponse,
    LoginCredentials,
    RecoveryRequestData,
    RecoveryResetData,
    RegisterData,
} from '@/types/auth';
import { User } from '@/types/user';
import { supabase } from '../supabase';

export const AuthAPI = {
  /**
   * Registrar novo usuário
   */
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.toLowerCase(),
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            birth_date: data.birth_date,
          },
        },
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        
        if (authError.message.includes('already registered')) {
          return {
            success: false,
            error: 'Este e-mail já está cadastrado',
          };
        }
        
        return {
          success: false,
          error: authError.message || 'Erro ao criar conta',
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Erro ao criar usuário',
        };
      }

      // Buscar dados completos do usuário na tabela public.users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, birth_date, created_at, updated_at')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        // Mesmo com erro, o usuário foi criado no auth
        return {
          success: true,
          data: {
            user: {
              id: authData.user.id,
              full_name: data.full_name,
              email: data.email,
              birth_date: data.birth_date,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as User,
          },
        };
      }

      return {
        success: true,
        data: {
          user: userData as User,
        },
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: 'Erro ao registrar. Tente novamente.',
      };
    }
  },

  /**
   * Login de usuário
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    try {
      // Login com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email.toLowerCase(),
        password: credentials.password,
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        return {
          success: false,
          error: 'E-mail ou senha incorretos',
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Erro ao fazer login',
        };
      }

      // Buscar dados completos do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, birth_date, created_at, updated_at')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        return {
          success: false,
          error: 'Erro ao buscar dados do usuário',
        };
      }

      return {
        success: true,
        data: {
          user: userData as User,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Erro ao fazer login. Tente novamente.',
      };
    }
  },

  /**
   * Solicitar recuperação de senha (Supabase envia e-mail automaticamente)
   */
  requestRecovery: async (data: RecoveryRequestData): Promise<ApiResponse<void>> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        data.email.toLowerCase(),
        {
          redirectTo: 'poupadin://reset-password', // Deep link para o app
        }
      );

      if (error) {
        console.error('Password reset error:', error);
        // Por segurança, não revelar se o e-mail existe
        return {
          success: true,
          message: 'Se o e-mail estiver cadastrado, você receberá instruções para recuperação.',
        };
      }

      return {
        success: true,
        message: 'Instruções de recuperação enviadas para seu e-mail.',
      };
    } catch (error) {
      console.error('Request recovery error:', error);
      return {
        success: false,
        error: 'Erro ao processar solicitação. Tente novamente.',
      };
    }
  },

  /**
   * Atualizar senha (usado após receber link de recuperação)
   */
  updatePassword: async (newPassword: string): Promise<ApiResponse<void>> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Update password error:', error);
        return {
          success: false,
          error: 'Erro ao atualizar senha. Tente novamente.',
        };
      }

      return {
        success: true,
        message: 'Senha atualizada com sucesso',
      };
    } catch (error) {
      console.error('Update password error:', error);
      return {
        success: false,
        error: 'Erro ao atualizar senha',
      };
    }
  },

  /**
   * Resetar senha com código (mantido para compatibilidade com fluxo atual)
   */
  resetPassword: async (data: RecoveryResetData): Promise<ApiResponse<void>> => {
    // Como o Supabase Auth não usa códigos por padrão, 
    // essa função pode redirecionar para updatePassword
    // ou você pode manter a lógica custom de recovery_codes se preferir
    try {
      return {
        success: false,
        error: 'Use o link enviado por e-mail para resetar sua senha',
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: 'Erro ao resetar senha',
      };
    }
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  /**
   * Obter sessão atual
   */
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },
};