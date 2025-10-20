import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '@/theme';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

interface SuccessAnimationProps {
  visible: boolean;
  message: string;
  animationSource: any; // Lottie JSON
  onComplete: () => void;
  duration?: number; // Em milissegundos
}

export function SuccessAnimation({
  visible,
  message,
  animationSource,
  onComplete,
  duration = 2000,
}: SuccessAnimationProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible) {
      // Reproduzir animação
      animationRef.current?.play();

      // Auto-fechar após duração
      const timer = setTimeout(() => {
        onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onComplete]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onComplete}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.backgroundSecondary },
          ]}>
          <LottieView
            ref={animationRef}
            source={animationSource}
            style={styles.animation}
            loop={false}
          />
          <Text style={[styles.message, { color: colors.text }]}>
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: 280,
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  animation: {
    width: 150,
    height: 150,
  },
  message: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});