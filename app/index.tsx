import { Redirect } from 'expo-router';

export default function Index() {
  // Este componente apenas redireciona
  // A lógica real está no _layout.tsx
  return <Redirect href="/welcome" />;
}