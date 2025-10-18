/**
 * Authentication Types
 */

import { User } from './user';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  birth_date: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RecoveryRequestData {
  email: string;
}

export interface RecoveryVerifyData {
  email: string;
  code: string;
}

export interface RecoveryResetData {
  email: string;
  code: string;
  new_password: string;
}

export interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}