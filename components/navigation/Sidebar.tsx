import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75;

export function Sidebar() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isOpen, closeSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const translateX = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  const handleLogout = async () => {
    closeSidebar();
    await logout();
    router.replace('/welcome');
  };

  const MenuItem = ({
    icon,
    label,
    onPress,
  }: {
    icon: any;
    label: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}>
      <IconSymbol name={icon} size={22} color={colors.text} />
      <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
      <IconSymbol name="chevron.right" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={closeSidebar}>
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={closeSidebar}>
        <Animated.View
          style={[
            styles.sidebar,
            {
              backgroundColor: colors.backgroundSecondary,
              transform: [{ translateX }],
            },
          ]}>
          {/* Header com perfil */}
          <TouchableOpacity
            style={[styles.profileSection, { borderBottomColor: colors.border }]}
            onPress={() => {
              closeSidebar();
              router.push('/(tabs)/profile');
            }}
            activeOpacity={0.7}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.full_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.full_name}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user?.email}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Menu Gerenciamento */}
          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Gerenciamento
            </Text>
            <MenuItem icon="paperplane.fill" label="Exportar Registros" />
            <MenuItem icon="house.fill" label="Restaurar e Backup" />
            <MenuItem icon="house.fill" label="Resetar e Apagar" />
          </View>

          {/* Menu Aplicação */}
          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              PoupaDin
            </Text>
            <MenuItem icon="house.fill" label="Curtir" />
            <MenuItem icon="paperplane.fill" label="Feedbacks" />
            <MenuItem icon="paperplane.fill" label="Convidar Amigos" />
          </View>

          {/* Botão Sair */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={handleLogout}
            activeOpacity={0.8}>
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    paddingTop: Spacing['4xl'],
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    marginBottom: Spacing.base,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: Typography.fontSize.sm,
  },
  menuSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  menuLabel: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    marginLeft: Spacing.md,
  },
  logoutButton: {
    margin: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Spacing['2xl'],
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
});