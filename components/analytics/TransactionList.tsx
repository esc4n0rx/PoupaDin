// components/analytics/TransactionList.tsx

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { TransactionsByDay } from '@/types/analytics';
import { ChartUtils } from '@/utils/chart';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TransactionListProps {
  data: TransactionsByDay[];
}

export function TransactionList({ data }: TransactionListProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (data.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Nenhuma transação neste período
        </Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}`;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Transações
      </Text>

      {data.map((dayData, dayIndex) => (
        <View key={dayIndex} style={styles.dayGroup}>
          <View style={[styles.dayHeader, { backgroundColor: colors.background }]}>
            <View>
              <Text style={[styles.dayDate, { color: colors.text }]}>
                {dayData.day_name}
              </Text>
              <Text style={[styles.dayDateSmall, { color: colors.textSecondary }]}>
                {formatDate(dayData.date)}
              </Text>
            </View>
            <Text style={[styles.dayTotal, { color: colors.text }]}>
              {ChartUtils.formatCurrency(dayData.total)}
            </Text>
          </View>

          {dayData.transactions.map((transaction, transIndex) => (
            <View
              key={transaction.id}
              style={[
                styles.transactionItem,
                { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border },
                transIndex === dayData.transactions.length - 1 && styles.lastItem,
              ]}>
              <View style={styles.transactionLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: transaction.category_color + '20' },
                  ]}>
                  <IconSymbol
                    name={transaction.category_icon as any}
                    size={20}
                    color={transaction.category_color}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionName, { color: colors.text }]} numberOfLines={1}>
                    {transaction.name}
                  </Text>
                  <Text style={[styles.categoryName, { color: colors.textSecondary }]} numberOfLines={1}>
                    {transaction.category_name}
                  </Text>
                </View>
              </View>

              <Text style={[styles.transactionAmount, { color: transaction.category_color }]}>
                {ChartUtils.formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.md,
  },
  dayGroup: {
    marginBottom: Spacing.base,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.xs,
  },
  dayDate: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  dayDateSmall: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  dayTotal: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: BorderRadius.base,
    borderBottomRightRadius: BorderRadius.base,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },
  categoryName: {
    fontSize: Typography.fontSize.xs,
  },
  transactionAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  emptyState: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
  },
});