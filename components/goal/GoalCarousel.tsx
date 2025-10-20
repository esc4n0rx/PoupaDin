// components/goal/GoalCarousel.tsx

import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { GoalWithProgress } from '@/types/goal';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - Spacing.base * 2;
const AUTO_SCROLL_INTERVAL = 4000; // 4 segundos

interface GoalCarouselProps {
  goals: GoalWithProgress[];
}

export function GoalCarousel({ goals }: GoalCarouselProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filtrar apenas objetivos ativos (não concluídos)
  const activeGoals = goals.filter((goal) => !goal.is_completed);

  // Auto-scroll se houver mais de 1 objetivo
  useEffect(() => {
    if (activeGoals.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % activeGoals.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * CARD_WIDTH,
          animated: true,
        });
        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [activeGoals.length]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / CARD_WIDTH);
    setCurrentIndex(index);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  if (activeGoals.length === 0) {
    return null; // Não exibir nada se não houver objetivos ativos
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}>
        {activeGoals.map((goal) => {
          const hasTarget = goal.target_amount && goal.target_amount > 0;
          const progressPercentage = goal.progress_percentage || 0;

          return (
            <View
              key={goal.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}>
              {/* Header */}
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: goal.color }]}>
                  <IconSymbol name={goal.icon as any} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.headerInfo}>
                  <Text style={[styles.goalName, { color: colors.text }]} numberOfLines={1}>
                    {goal.name}
                  </Text>
                  {goal.days_remaining !== undefined && goal.days_remaining >= 0 && (
                    <View style={styles.daysContainer}>
                      <IconSymbol name="clock.fill" size={12} color={colors.textSecondary} />
                      <Text style={[styles.daysText, { color: colors.textSecondary }]}>
                        {goal.days_remaining === 0
                          ? 'Vence hoje'
                          : goal.days_remaining === 1
                          ? '1 dia restante'
                          : `${goal.days_remaining} dias restantes`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Amount Info */}
              <View style={styles.amountRow}>
                <View>
                  <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                    Saldo Atual
                  </Text>
                  <Text style={[styles.amountValue, { color: colors.text }]}>
                    {formatCurrency(goal.current_amount)}
                  </Text>
                </View>

                {hasTarget && (
                  <View style={styles.targetContainer}>
                    <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                      Meta
                    </Text>
                    <Text style={[styles.amountValue, { color: colors.text }]}>
                      {formatCurrency(goal.target_amount!)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Progress Bar */}
              {hasTarget && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(progressPercentage, 100)}%`,
                          backgroundColor: goal.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                    {progressPercentage.toFixed(1)}% concluído
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Pagination Dots */}
      {activeGoals.length > 1 && (
        <View style={styles.pagination}>
          {activeGoals.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex ? colors.primary : colors.textTertiary,
                  opacity: index === currentIndex ? 1 : 0.3,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginRight: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  daysText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  targetContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: Typography.fontSize.xs,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  progressContainer: {
    gap: Spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});