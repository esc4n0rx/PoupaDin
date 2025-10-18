import { CATEGORY_ICONS } from '@/constants/categoryIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { CategoryWithBudget } from '@/types/category';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';

type CategoryIcon = typeof CATEGORY_ICONS[keyof typeof CATEGORY_ICONS][number];

interface CategoryCardProps {
  category: CategoryWithBudget;
  onPress: () => void;
  onLongPress: () => void;
}

export function CategoryCard({ category, onPress, onLongPress }: CategoryCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const hasbudget = category.type === 'expense' && category.monthly_budget && category.monthly_budget > 0;
  const budgetPercentage = category.budget_percentage || 0;
  const isOverBudget = budgetPercentage > 100;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
        <IconSymbol
          name={category.icon as CategoryIcon}
          size={24}
          color="#FFFFFF"
        />
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {category.name}
        </Text>

        {hasbudget && (
          <>
            <View style={styles.budgetInfo}>
              <Text style={[styles.budgetText, { color: colors.textSecondary }]}>
                R$ {category.spent_amount?.toFixed(2) || '0.00'} / R$ {category.monthly_budget!.toFixed(2)}
              </Text>
              {isOverBudget && (
                <Text style={[styles.overBudgetText, { color: colors.error }]}>
                  Excedido
                </Text>
              )}
            </View>

            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(budgetPercentage, 100)}%`,
                    backgroundColor: isOverBudget ? colors.error : category.color,
                  },
                ]}
              />
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: Spacing.xs,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  budgetText: {
    fontSize: Typography.fontSize.sm,
  },
  overBudgetText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  progressBar: {
    height: 6,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
});