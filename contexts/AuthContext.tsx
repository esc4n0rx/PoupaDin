import { AuthAPI } from '@/services/api/auth';
import { UserAPI } from '@/services/api/user';
import { Storage } from '@/services/storage';
import { supabase } from '@/services/supabase';
import { LoginCredentials, RegisterData } from '@/types/auth';
import { User } from '@/types/user';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão inicial
    checkAuth();

    // Listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          await Storage.clearAll();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token foi renovado automaticamente pelo Supabase
          await loadUserData(session.user.id);
        }
      }
    );

    // Cleanup
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const session = await AuthAPI.getSession();

      if (session?.user) {
        await loadUserData(session.user.id);
      }
    } catch (error) {
      console.error('Check auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      const response = await UserAPI.getUserById(userId);
      if (response.success && response.data) {
        setUser(response.data);
        await Storage.saveUserData(response.data);
      }
    } catch (error) {
      console.error('Load user data error:', error);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await AuthAPI.login(credentials);

      if (response.success && response.data) {
        setUser(response.data.user);
        await Storage.saveUserData(response.data.user);
        return { success: true };
      }

      return { success: false, error: response.error || 'Erro ao fazer login' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro ao fazer login' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await AuthAPI.register(data);

      if (response.success) {
        // Não fazer login automático, usuário precisa confirmar email se configurado
        return { success: true };
      }

      return { success: false, error: response.error || 'Erro ao registrar' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Erro ao registrar' };
    }
  };

  const logout = async () => {
    try {
      await AuthAPI.logout();
      setUser(null);
      await Storage.clearAll();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const response = await UserAPI.getUserById(user.id);
      if (response.success && response.data) {
        setUser(response.data);
        await Storage.saveUserData(response.data);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}