import { Stack } from 'expo-router';
import { useColorScheme } from '../../hooks/use-color-scheme';

export default function AuthLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FEF3E2',
        },
      }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="recovery" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}