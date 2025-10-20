import { Sidebar } from '@/components/navigation/Sidebar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '@/theme';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function TabBarIcon({ name, color }: { name: any; color: string }) {
  return <IconSymbol name={name} size={24} color={color} />;
}

function CustomHeader({ title }: { title: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { toggleSidebar } = useSidebar();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.backgroundSecondary,
          borderBottomColor: colors.border,
        },
      ]}>
      <TouchableOpacity
        onPress={toggleSidebar}
        style={styles.menuButton}
        activeOpacity={0.7}>
        <IconSymbol name="line.3.horizontal" size={24} color={colors.text} />
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerIcon} activeOpacity={0.7}>
          <IconSymbol name="magnifyingglass" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon} activeOpacity={0.7}>
          <IconSymbol name="bell.fill" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TabsLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.backgroundSecondary,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 85 : 90,
            paddingBottom: Platform.OS === 'ios' ? 25 : 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: Typography.fontSize.xs,
            fontWeight: Typography.fontWeight.medium,
            marginTop: 2,
          },
          header: () => null,
          animation: 'shift',
          lazy: true,
          ...(Platform.OS === 'ios' && {
            animationEnabled: true,
            animationDuration: 200,
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="records"
          options={{
            title: 'Registros',
            tabBarIcon: ({ color }) => <TabBarIcon name="house.fill" color={color} />,
            header: () => <CustomHeader title="Registros" />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Análises',
            tabBarIcon: ({ color }) => <TabBarIcon name="chart.bar.fill" color={color} />,
            header: () => <CustomHeader title="Análises" />,
          }}
        />
        <Tabs.Screen
          name="expense"
          options={{
            title: 'Despesas',
            tabBarIcon: ({ color }) => <TabBarIcon name="creditcard.fill" color={color} />,
            header: () => <CustomHeader title="Despesas" />,
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: 'Objetivos',
            tabBarIcon: ({ color }) => <TabBarIcon name="target" color={color} />,
            header: () => <CustomHeader title="Objetivos" />,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categorias',
            tabBarIcon: ({ color }) => <TabBarIcon name="list.bullet" color={color} />,
            header: () => <CustomHeader title="Categorias" />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <Sidebar />
    </>
  );
}

export default function TabLayout() {
  return (
    <SidebarProvider>
      <TabsLayout />
    </SidebarProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
});