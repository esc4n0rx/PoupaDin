/**
 * Poupadin Design System
 * Cores, tipografia e estilos baseados no mockup fornecido
 */
import { Platform } from 'react-native';
// Paleta de cores do Poupadin
const primaryColor = '#D1FF2A'; // Verde limão
const backgroundDark = '#0A0A0A'; // Preto profundo
const backgroundLight = '#FFFFFF'; // Branco puro
const textDark = '#FFFFFF'; // Texto em modo escuro
const textLight = '#111111'; // Texto em modo claro
const grayDark = '#1A1A1A'; // Cinza escuro para cards
const grayLight = '#F5F5F5'; // Cinza claro para cards

export const Colors = {
  light: {
    text: textLight,
    background: backgroundLight,
    card: grayLight,
    primary: primaryColor,
    border: '#E0E0E0',
    error: '#FF3B30',
    success: '#34C759',
    placeholder: '#8E8E93',
  },
  dark: {
    text: textDark,
    background: backgroundDark,
    card: grayDark,
    primary: primaryColor,
    border: '#2C2C2E',
    error: '#FF453A',
    success: '#32D74B',
    placeholder: '#636366',
  },
};

export const Fonts = Platform.select({
  ios: {
    display: 'SF Pro Display',
    text: 'SF Pro Text',
    mono: 'SF Mono',
  },
  default: {
    display: 'System',
    text: 'System',
    mono: 'monospace',
  },
  web: {
    display: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    text: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", "Courier New", monospace',
  },
});

export const FontSizes = {
  largeTitle: 48,
  title1: 34,
  title2: 28,
  title3: 22,
  headline: 17,
  body: 17,
  callout: 16,
  subheadline: 15,
  footnote: 13,
  caption: 12,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};