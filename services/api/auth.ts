/**
 * Authentication API Service
 */

import { ApiResponse } from '@/types/api';
import {
    AuthResponse,
    AuthTokens,
    LoginCredentials,
    RecoveryRequestData,
    RecoveryResetData,
    RecoveryVerifyData,
    RegisterData,
} from '@/types/auth';
import { User } from '@/types/user';
import { Crypto } from '@/utils/crypto';
import { DateUtils } from '@/utils/date';
import { EmailService } from '../email';
import { supabase } from '../supabase';

export const AuthAPI = {
  /**
   * Registrar novo usuário
   */
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    try {
      // Verificar se e-mail já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .single();

      if (existingUser) {
        return {
          success: false,
          error: 'Este e-mail já está cadastrado',
        };
      }

      // Hash da senha
      const passwordHash = await Crypto.hashPassword(data.password);

      // Criar usuário
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            full_name: data.full_name,
            email: data.email.toLowerCase(),
            password_hash: passwordHash,
            birth_date: data.birth_date,
          },
        ])
        .select()
        .single();

      if (createError || !newUser) {
        console.error('Error creating user:', createError);
        return {
          success: false,
          error: 'Erro ao criar usuário. Tente novamente.',
        };
      }

      // Gerar tokens (agora com await)
      const accessToken = await Crypto.generateAccessToken(newUser.id, newUser.email);
      const refreshToken = await Crypto.generateRefreshToken(newUser.id);

      // Salvar refresh token no banco
      const expiresAt = DateUtils.addDays(new Date(), 7);
      await supabase.from('refresh_tokens').insert([
        {
          user_id: newUser.id,
          token: refreshToken,
          expires_at: expiresAt.toISOString(),
        },
      ]);

      // Remover password_hash do retorno
      const { password_hash, ...userWithoutPassword } = newUser;

      return {
        success: true,
        data: {
          user: userWithoutPassword as User,
          tokens: {
            accessToken,
            refreshToken,
          },
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
      // Buscar usuário por e-mail
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email.toLowerCase())
        .single();

      if (userError || !user) {
        return {
          success: false,
          error: 'E-mail ou senha incorretos',
        };
      }

      // Verificar senha
      const isPasswordValid = await Crypto.comparePassword(
        credentials.password,
        user.password_hash
      );

      if (!isPasswordValid) {
        return {
          success: false,
          error: 'E-mail ou senha incorretos',
        };
      }

      // Gerar tokens (agora com await)
      const accessToken = await Crypto.generateAccessToken(user.id, user.email);
      const refreshToken = await Crypto.generateRefreshToken(user.id);

      // Salvar refresh token no banco
      const expiresAt = DateUtils.addDays(new Date(), 7);
      await supabase.from('refresh_tokens').insert([
        {
          user_id: user.id,
          token: refreshToken,
          expires_at: expiresAt.toISOString(),
        },
      ]);

      // Remover password_hash do retorno
      const { password_hash, ...userWithoutPassword } = user;

      return {
        success: true,
        data: {
          user: userWithoutPassword as User,
          tokens: {
            accessToken,
            refreshToken,
          },
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
   * Renovar access token usando refresh token
   */
  refreshAccessToken: async (refreshToken: string): Promise<ApiResponse<AuthTokens>> => {
    try {
      // Verificar refresh token (agora com await)
      const decoded = await Crypto.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return {
          success: false,
          error: 'Token inválido',
        };
      }

      // Verificar se o token existe no banco e não está expirado
      const { data: tokenData, error: tokenError } = await supabase
        .from('refresh_tokens')
        .select('*')
        .eq('token', refreshToken)
        .eq('user_id', decoded.userId)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        return {
          success: false,
          error: 'Token expirado ou inválido',
        };
      }

      // Buscar usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', decoded.userId)
        .single();

      if (userError || !user) {
        return {
          success: false,
          error: 'Usuário não encontrado',
        };
      }

      // Gerar novo access token (agora com await)
      const newAccessToken = await Crypto.generateAccessToken(user.id, user.email);

      return {
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: refreshToken, // Mantém o mesmo refresh token
        },
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        error: 'Erro ao renovar token',
      };
    }
  },

  /**
   * Solicitar recuperação de senha (enviar código por e-mail)
   */
  requestRecovery: async (data: RecoveryRequestData): Promise<ApiResponse<void>> => {
    try {
      // Verificar se usuário existe
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('email', data.email.toLowerCase())
        .single();

      if (userError || !user) {
        // Por segurança, não revelar se o e-mail existe ou não
        return {
          success: true,
          message: 'Se o e-mail estiver cadastrado, você receberá um código de recuperação.',
        };
      }

      // Gerar código de 6 dígitos
      const code = Crypto.generateRecoveryCode();
      const expiresAt = DateUtils.addMinutes(new Date(), 10); // 10 minutos

      // Salvar código no banco
      const { error: codeError } = await supabase.from('recovery_codes').insert([
        {
          user_id: user.id,
          code: code,
          expires_at: expiresAt.toISOString(),
        },
      ]);

      if (codeError) {
        console.error('Error saving recovery code:', codeError);
        return {
          success: false,
          error: 'Erro ao processar solicitação. Tente novamente.',
        };
      }

      // Enviar e-mail com o código
      const emailSent = await EmailService.sendRecoveryEmail({
        to: user.email,
        code: code,
        userName: user.full_name,
      });

      if (!emailSent) {
        return {
          success: false,
          error: 'Erro ao enviar e-mail. Tente novamente.',
        };
      }

      return {
        success: true,
        message: 'Código de recuperação enviado para seu e-mail.',
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
   * Verificar código de recuperação
   */
  verifyRecoveryCode: async (data: RecoveryVerifyData): Promise<ApiResponse<void>> => {
    try {
      // Buscar usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .single();

      if (userError || !user) {
        return {
          success: false,
          error: 'Código inválido ou expirado',
        };
      }

      // Verificar código
      const { data: codeData, error: codeError } = await supabase
        .from('recovery_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('code', data.code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (codeError || !codeData) {
        return {
          success: false,
          error: 'Código inválido ou expirado',
        };
      }

      return {
        success: true,
        message: 'Código verificado com sucesso',
      };
    } catch (error) {
      console.error('Verify code error:', error);
      return {
        success: false,
        error: 'Erro ao verificar código',
      };
    }
  },

  /**
   * Resetar senha após verificação do código
   */
  resetPassword: async (data: RecoveryResetData): Promise<ApiResponse<void>> => {
    try {
      // Buscar usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .single();

      if (userError || !user) {
        return {
          success: false,
          error: 'Código inválido ou expirado',
        };
      }

      // Verificar código novamente
      const { data: codeData, error: codeError } = await supabase
        .from('recovery_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('code', data.code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (codeError || !codeData) {
        return {
          success: false,
          error: 'Código inválido ou expirado',
        };
      }

      // Hash da nova senha
      const passwordHash = await Crypto.hashPassword(data.new_password);

      // Atualizar senha
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating password:', updateError);
        return {
          success: false,
          error: 'Erro ao atualizar senha. Tente novamente.',
        };
      }

      // Marcar código como usado
      await supabase
        .from('recovery_codes')
        .update({ used: true })
        .eq('id', codeData.id);

      // Invalidar todos os refresh tokens do usuário (segurança)
      await supabase.from('refresh_tokens').delete().eq('user_id', user.id);

      return {
        success: true,
        message: 'Senha alterada com sucesso',
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
   * Logout - invalidar refresh token
   */
  logout: async (refreshToken: string): Promise<void> => {
    try {
      await supabase.from('refresh_tokens').delete().eq('token', refreshToken);
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
};