import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ThemedView } from '../../components/themed-view';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '../../theme';
import { DateUtils } from '../../utils/date';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/welcome');
  };

  if (!user) return null;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>
            {user.full_name}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>
            {user.email}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Data de Nascimento
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {DateUtils.formatToBrazilian(user.birth_date)}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Idade
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {DateUtils.calculateAge(user.birth_date)} anos
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Membro desde
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {DateUtils.formatToBrazilian(user.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Sair"
            onPress={handleLogout}
            variant="outline"
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  avatarText: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  name: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: Typography.fontSize.base,
  },
  infoSection: {
    marginBottom: Spacing['2xl'],
  },
  infoCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
  },
  actions: {
    marginTop: Spacing.xl,
  },
});