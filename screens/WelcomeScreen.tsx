import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { ThemedView } from '../components/themed-view';
import { Button } from '../components/ui/Button';
import { useColorScheme } from '../hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '../theme';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStart = () => {
    router.push('/auth/login');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Animação Lottie */}
        <View style={styles.animationContainer}>
          <LottieView
            source={require('../assets/lottie/finance.json')}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>

        {/* Textos com animação */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Bem-vindo ao PoupaDin
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Organize suas finanças com facilidade e alcance seus objetivos financeiros
          </Text>
        </Animated.View>

        {/* Botão */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
            },
          ]}>
          <Button
            title="Começar"
            onPress={handleStart}
            size="large"
          />
        </Animated.View>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['4xl'],
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: 280,
    height: 280,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.lg,
  },
  buttonContainer: {
    paddingTop: Spacing.xl,
  },
});