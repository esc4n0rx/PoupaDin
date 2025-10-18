/**
 * PoupaDin - Color Palette
 * Baseado no System Design e mockups fornecidos
 */

export const Colors = {
  light: {
    // Backgrounds
    background: '#FEF3E2',
    backgroundSecondary: '#FFFFFF',
    
    // Text
    text: '#1A1A1A',
    textSecondary: '#6B6B6B',
    textTertiary: '#9E9E9E',
    
    // Primary Actions
    primary: '#2D2D2D',
    primaryHover: '#1A1A1A',
    
    // Borders
    border: '#E0E0E0',
    borderFocus: '#2D2D2D',
    
    // States
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Input
    inputBackground: '#FFFFFF',
    inputPlaceholder: '#9E9E9E',

    categoryIncome: '#4CAF50',
    categoryExpense: '#F44336',
  },
  
  dark: {
    // Backgrounds
    background: '#1A1A1A',
    backgroundSecondary: '#2D2D2D',
    
    // Text
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#808080',
    
    // Primary Actions
    primary: '#FEF3E2',
    primaryHover: '#E8DCC8',
    
    // Borders
    border: '#404040',
    borderFocus: '#FEF3E2',
    
    // States
    success: '#66BB6A',
    error: '#EF5350',
    warning: '#FFA726',
    info: '#42A5F5',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Input
    inputBackground: '#2D2D2D',
    inputPlaceholder: '#808080',

    categoryIncome: '#66BB6A',
    categoryExpense: '#EF5350',
  },
};

export type ColorScheme = 'light' | 'dark';
export type ColorName = keyof typeof Colors.light;