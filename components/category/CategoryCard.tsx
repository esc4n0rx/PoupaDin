// components/category/CategoryCard.tsx

import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { CategoryWithBudget } from '@/types/category';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';

interface CategoryCardProps {
  category: CategoryWithBudget;
  onPress: () => void;
  onLongPress: () => void;
}

export function CategoryCard({ category, onPress, onLongPress }: CategoryCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const isIncome = category.type === 'income';
  const isExpense = category.type === 'expense';
  const hasBudget = isExpense && category.monthly_budget && category.monthly_budget > 0;
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
      {/* Ícone */}
      <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
        <IconSymbol
          name={category.icon as any}
          size={24}
          color="#FFFFFF"
        />
      </View>

      {/* Informações */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {category.name}
        </Text>

        {/* Saldo para categorias de receita */}
        {isIncome && (
          <View style={styles.balanceInfo}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
              Saldo do mês:
            </Text>
            <Text style={[styles.balanceAmount, { color: colors.success }]}>
              R$ {category.current_balance.toFixed(2)}
            </Text>
          </View>
        )}

        {hasBudget && (
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

            {/* Barra de progresso */}
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

        {/* Para despesas sem orçamento, mostrar apenas o total gasto */}
        {isExpense && !hasBudget && (
          <View style={styles.balanceInfo}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
              Gasto no mês:
            </Text>
            <Text style={[styles.balanceAmount, { color: colors.error }]}>
              R$ {category.current_balance.toFixed(2)}
            </Text>
          </View>
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
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: Typography.fontSize.sm,
  },
  balanceAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
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