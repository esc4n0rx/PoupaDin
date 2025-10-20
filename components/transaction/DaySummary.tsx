// components/transaction/DaySummary.tsx

import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { DaySummary as DaySummaryType } from '@/types/transaction';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';

interface DaySummaryProps {
  summary: DaySummaryType;
}

export const DaySummary = React.memo(({ summary }: DaySummaryProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const formatCurrency = useCallback((value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }, []);

  const balanceColor = useMemo(() => {
    if (summary.balance > 0) {
      return colors.success;
    }
    if (summary.balance < 0) {
      return colors.error;
    }
    return colors.textSecondary;
  }, [summary.balance, colors]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Receitas */}
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <IconSymbol
            name="arrow.down.circle.fill"
            size={20}
            color={colors.success}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Receitas
          </Text>
        </View>
        <Text style={[styles.value, { color: colors.success }]}>
          {formatCurrency(summary.total_income)}
        </Text>
      </View>

      {/* Despesas */}
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <IconSymbol
            name="arrow.up.circle.fill"
            size={20}
            color={colors.error}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Despesas
          </Text>
        </View>
        <Text style={[styles.value, { color: colors.error }]}>
          {formatCurrency(summary.total_expense)}
        </Text>
      </View>

      {/* Saldo */}
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <IconSymbol
            name="chart.bar.fill"
            size={20}
            color={balanceColor}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Saldo
          </Text>
        </View>
        <Text style={[styles.value, styles.balance, { color: balanceColor }]}>
          {formatCurrency(summary.balance)}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    marginBottom: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: 4,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  value: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  balance: {
    fontSize: Typography.fontSize.lg,
  },
});
