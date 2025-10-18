import { StyleSheet, Text, View } from 'react-native';
import { ThemedView } from '../../components/themed-view';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '../../theme';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Olá, {user?.full_name}!
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Bem-vindo ao PoupaDin
        </Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    textAlign: 'center',
  },
});