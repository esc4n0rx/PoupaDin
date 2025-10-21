import { Loader } from '@/components/ui/Loader';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Linking from 'expo-linking';
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
      if (!inTabsGroup) {
        router.replace('/records');
      }
    } else {
      if (inTabsGroup) {
        router.replace('/welcome');
      }
    }
  }, [isLoading, isAuthenticated, segments]);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);
      
      if (path === 'reset-password') {
        router.push('/auth/reset-password');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        const { path } = Linking.parse(url);
        if (path === 'reset-password') {
          router.push('/auth/reset-password');
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

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