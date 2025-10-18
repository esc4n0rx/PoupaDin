/**
 * Validation Utilities
 */

export const Validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password: string): { valid: boolean; message?: string } => {
    if (password.length < 6) {
      return { valid: false, message: 'A senha deve ter no mínimo 6 caracteres' };
    }
    if (password.length > 50) {
      return { valid: false, message: 'A senha deve ter no máximo 50 caracteres' };
    }
    return { valid: true };
  },

  fullName: (name: string): boolean => {
    return name.trim().length >= 3 && name.includes(' ');
  },

  birthDate: (date: string): { valid: boolean; message?: string } => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (isNaN(birthDate.getTime())) {
      return { valid: false, message: 'Data inválida' };
    }
    
    if (age < 13) {
      return { valid: false, message: 'Você deve ter pelo menos 13 anos' };
    }
    
    if (age > 120) {
      return { valid: false, message: 'Data de nascimento inválida' };
    }
    
    return { valid: true };
  },

  code: (code: string): boolean => {
    return /^\d{6}$/.test(code);
  },
};