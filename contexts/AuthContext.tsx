import { AuthAPI } from '@/services/api/auth';
import { UserAPI } from '@/services/api/user';
import { Storage } from '@/services/storage';
import { LoginCredentials, RegisterData } from '@/types/auth';
import { User } from '@/types/user';
import { Crypto } from '@/utils/crypto';
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

  // Verificar se usuário está autenticado ao iniciar o app
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const accessToken = await Storage.getAccessToken();
      const refreshToken = await Storage.getRefreshToken();

      if (!accessToken || !refreshToken) {
        setIsLoading(false);
        return;
      }

      // Verificar se access token é válido (agora com await)
      const decoded = await Crypto.verifyAccessToken(accessToken);

      if (decoded) {
        // Token válido, buscar dados do usuário
        const response = await UserAPI.getUserById(decoded.userId);
        if (response.success && response.data) {
          setUser(response.data);
        }
      } else {
        // Token expirado, tentar renovar
        const response = await AuthAPI.refreshAccessToken(refreshToken);
        if (response.success && response.data) {
          await Storage.saveTokens(response.data);
          
          // Buscar dados do usuário (agora com await)
          const decoded = await Crypto.verifyAccessToken(response.data.accessToken);
          if (decoded) {
            const userResponse = await UserAPI.getUserById(decoded.userId);
            if (userResponse.success && userResponse.data) {
              setUser(userResponse.data);
            }
          }
        } else {
          // Não foi possível renovar, fazer logout
          await Storage.clearAll();
        }
      }
    } catch (error) {
      console.error('Check auth error:', error);
      await Storage.clearAll();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await AuthAPI.login(credentials);

      if (response.success && response.data) {
        await Storage.saveTokens(response.data.tokens);
        await Storage.saveUserData(response.data.user);
        setUser(response.data.user);
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

      if (response.success && response.data) {
        // Após registro, não fazer login automático
        // Usuário precisa fazer login manualmente
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
      const refreshToken = await Storage.getRefreshToken();
      if (refreshToken) {
        await AuthAPI.logout(refreshToken);
      }
      await Storage.clearAll();
      setUser(null);
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