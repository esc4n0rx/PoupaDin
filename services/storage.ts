/**
 * AsyncStorage Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_DATA: '@poupadin:user_data',
};

export const Storage = {
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
      await AsyncStorage.removeItem(KEYS.USER_DATA);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
};