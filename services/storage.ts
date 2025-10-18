/**
 * AsyncStorage Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens } from '../types/auth';

const KEYS = {
  ACCESS_TOKEN: '@poupadin:access_token',
  REFRESH_TOKEN: '@poupadin:refresh_token',
  USER_DATA: '@poupadin:user_data',
};

export const Storage = {
  /**
   * Salvar tokens de autenticação
   */
  saveTokens: async (tokens: AuthTokens): Promise<void> => {
    try {
      await AsyncStorage.multiSet([
        [KEYS.ACCESS_TOKEN, tokens.accessToken],
        [KEYS.REFRESH_TOKEN, tokens.refreshToken],
      ]);
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  },

  /**
   * Obter access token
   */
  getAccessToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  /**
   * Obter refresh token
   */
  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  /**
   * Salvar dados do usuário
   */
  saveUserData: async (userData: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  },

  /**
   * Obter dados do usuário
   */
  getUserData: async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  /**
   * Limpar todos os dados (logout)
   */
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        KEYS.ACCESS_TOKEN,
        KEYS.REFRESH_TOKEN,
        KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
};