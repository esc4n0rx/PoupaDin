import { Loader } from '@/components/ui/Loader';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';
    const inWelcome = segments[0] === 'welcome';

    if (isAuthenticated) {
      // Usuário autenticado - redirecionar para tabs se não estiver lá
      if (!inTabsGroup) {
        router.replace('/(tabs)');
      }
    } else {
      // Usuário não autenticado - redirecionar para welcome/auth
      if (inTabsGroup) {
        router.replace('/welcome');
      }
    }
  }, [isLoading, isAuthenticated, segments]);

  if (isLoading) {
    return <Loader fullScreen text="Carregando..." />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FEF3E2',
          },
        }}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}