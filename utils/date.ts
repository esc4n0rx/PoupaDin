/**
 * Date Utilities
 */

export const DateUtils = {
  /**
   * Formatar data para formato brasileiro (DD/MM/YYYY)
   */
  formatToBrazilian: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },

  /**
   * Formatar data para ISO (YYYY-MM-DD)
   */
  formatToISO: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  },

  /**
   * Calcular idade a partir da data de nascimento
   */
  calculateAge: (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  },

  /**
   * Adicionar minutos a uma data
   */
  addMinutes: (date: Date, minutes: number): Date => {
    return new Date(date.getTime() + minutes * 60000);
  },

  /**
   * Adicionar dias a uma data
   */
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
};