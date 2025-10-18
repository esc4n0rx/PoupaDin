import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '../../theme';

interface LoaderProps {
  size?: 'small' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export function Loader({ size = 'large', text, fullScreen = false }: LoaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const content = (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={colors.primary} />
      {text && (
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          {text}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  fullScreen: {
    flex: 1,
  },
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.sm,
  },
});