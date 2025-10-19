// components/goal/GoalCard.tsx

import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { GoalWithProgress } from '@/types/goal';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';

interface GoalCardProps {
  goal: GoalWithProgress;
  onPress: () => void;
  onLongPress: () => void;
}

export function GoalCard({ goal, onPress, onLongPress }: GoalCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const hasTarget = goal.target_amount && goal.target_amount > 0;
  const progressPercentage = goal.progress_percentage || 0;
  const isCompleted = goal.is_completed;
  const isOverdue = goal.is_overdue || false;

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const getStatusInfo = () => {
    if (isCompleted) {
      return {
        text: 'Concluído',
        color: colors.success,
        icon: 'checkmark.circle.fill' as any,
      };
    }
    
    if (isOverdue) {
      return {
        text: 'Vencido',
        color: colors.error,
        icon: 'exclamationmark.triangle.fill' as any,
      };
    }

    if (goal.days_remaining !== undefined) {
      const days = goal.days_remaining;
      if (days === 0) {
        return {
          text: 'Vence hoje',
          color: colors.warning,
          icon: 'clock.fill' as any,
        };
      } else if (days === 1) {
        return {
          text: '1 dia restante',
          color: colors.info,
          icon: 'clock.fill' as any,
        };
      } else if (days > 0) {
        return {
          text: `${days} dias restantes`,
          color: colors.textSecondary,
          icon: 'calendar' as any,
        };
      }
    }

    return null;
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: colors.backgroundSecondary, 
          borderColor: colors.border,
          opacity: isCompleted ? 0.7 : 1,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: goal.color }]}>
          <IconSymbol
            name={goal.icon as any}
            size={28}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.headerInfo}>
          <Text 
            style={[
              styles.name, 
              { color: colors.text },
              isCompleted && styles.completedText,
            ]} 
            numberOfLines={2}>
            {goal.name}
          </Text>

          {statusInfo && (
            <View style={styles.statusContainer}>
              <IconSymbol
                name={statusInfo.icon}
                size={14}
                color={statusInfo.color}
              />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress Info */}
      <View style={styles.progressInfo}>
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

        {hasTarget && (
          <>
            {/* Progress Bar */}
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progressPercentage, 100)}%`,
                    backgroundColor: isCompleted ? colors.success : goal.color,
                  },
                ]}
              />
            </View>

            {/* Progress Text */}
            <View style={styles.progressTextRow}>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {progressPercentage.toFixed(1)}% concluído
              </Text>
              {goal.remaining_amount !== undefined && goal.remaining_amount > 0 && (
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                  Faltam {formatCurrency(goal.remaining_amount)}
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: Spacing.xs,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  progressInfo: {
    gap: Spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  targetContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: Typography.fontSize.xs,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  progressBar: {
    height: 8,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
  },
});