/**
 * Cryptography Utilities
 */
import bcrypt from 'bcryptjs';
import 'react-native-get-random-values';

export const Crypto = {
  /**
   * Hash de senha usando bcrypt
   */
  hashPassword: async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  /**
   * Comparar senha com hash
   */
  comparePassword: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  },

  /**
   * Gerar código de recuperação (6 dígitos)
   */
  generateRecoveryCode: (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
};