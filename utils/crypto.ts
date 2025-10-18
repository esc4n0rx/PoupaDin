/**
 * Cryptography Utilities
 */

import { DecodedToken } from '@/types/auth';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import 'react-native-get-random-values';

const JWT_SECRET = process.env.EXPO_PUBLIC_JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.EXPO_PUBLIC_JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

// Converter strings para Uint8Array (necessário para jose)
const getSecretKey = (secret: string) => new TextEncoder().encode(secret);

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
   * Gerar Access Token (JWT)
   */
  generateAccessToken: async (userId: string, email: string): Promise<string> => {
    const secret = getSecretKey(JWT_SECRET);
    
    const token = await new SignJWT({ userId, email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m') // 15 minutos
      .sign(secret);
    
    return token;
  },

  /**
   * Gerar Refresh Token
   */
  generateRefreshToken: async (userId: string): Promise<string> => {
    const secret = getSecretKey(JWT_REFRESH_SECRET);
    
    const token = await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // 7 dias
      .sign(secret);
    
    return token;
  },

  /**
   * Verificar Access Token
   */
  verifyAccessToken: async (token: string): Promise<DecodedToken | null> => {
    try {
      const secret = getSecretKey(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      return {
        userId: payload.userId as string,
        email: payload.email as string,
        iat: payload.iat as number,
        exp: payload.exp as number,
      };
    } catch (error) {
      console.error('Error verifying access token:', error);
      return null;
    }
  },

  /**
   * Verificar Refresh Token
   */
  verifyRefreshToken: async (token: string): Promise<{ userId: string } | null> => {
    try {
      const secret = getSecretKey(JWT_REFRESH_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      return {
        userId: payload.userId as string,
      };
    } catch (error) {
      console.error('Error verifying refresh token:', error);
      return null;
    }
  },

  /**
   * Gerar código de recuperação (6 dígitos)
   */
  generateRecoveryCode: (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
};