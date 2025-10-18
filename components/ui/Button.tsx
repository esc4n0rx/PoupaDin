import {
    ActivityIndicator,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle
} from 'react-native';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.base,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.base,
      },
      medium: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
      },
      large: {
        paddingVertical: Spacing.base,
        paddingHorizontal: Spacing.xl,
      },
    };

    // Variant
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: isDisabled ? '#CCCCCC' : colors.primary,
      },
      secondary: {
        backgroundColor: isDisabled ? '#F5F5F5' : colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: isDisabled ? '#CCCCCC' : colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
      ...(isDisabled && { opacity: 0.6 }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles: Record<string, TextStyle> = {
      small: {
        fontSize: Typography.fontSize.sm,
      },
      medium: {
        fontSize: Typography.fontSize.base,
      },
      large: {
        fontSize: Typography.fontSize.lg,
      },
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: {
        color: colorScheme === 'light' ? '#FFFFFF' : colors.background,
      },
      secondary: {
        color: colors.text,
      },
      outline: {
        color: colors.primary,
      },
    };

    return {
      fontWeight: Typography.fontWeight.semiBold,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : colors.primary}
          size="small"
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}