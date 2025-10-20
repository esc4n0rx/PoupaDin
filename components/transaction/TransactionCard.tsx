// components/transaction/TransactionCard.tsx

import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { TransactionWithCategory } from '@/types/transaction';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';

interface TransactionCardProps {
  transaction: TransactionWithCategory;
  onPress: () => void;
  onLongPress: () => void;
}

export function TransactionCard({
  transaction,
  onPress,
  onLongPress,
}: TransactionCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const isExpense = transaction.type === 'expense';
  const amountColor = isExpense ? colors.error : colors.success;
  const amountPrefix = isExpense ? '-' : '+';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}>
      {/* Ícone da categoria */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: transaction.category.color },
        ]}>
        <IconSymbol
          name={transaction.category.icon as any}
          size={24}
          color="#FFFFFF"
        />
      </View>

      {/* Informações */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {transaction.name}
        </Text>

        <View style={styles.detailsRow}>
          <Text style={[styles.category, { color: colors.textSecondary }]}>
            {transaction.category.name}
          </Text>

          {/* Se for despesa, mostrar fonte */}
          {isExpense && transaction.income_category && (
            <>
              <Text style={[styles.separator, { color: colors.textTertiary }]}>
                •
              </Text>
              <Text style={[styles.source, { color: colors.textSecondary }]}>
                de {transaction.income_category.name}
              </Text>
            </>
          )}
        </View>

        {/* Observação (se existir) */}
        {transaction.observation && (
          <Text
            style={[styles.observation, { color: colors.textTertiary }]}
            numberOfLines={1}>
            {transaction.observation}
          </Text>
        )}
      </View>

      {/* Valor */}
      <Text style={[styles.amount, { color: amountColor }]}>
        {amountPrefix} R$ {transaction.amount.toFixed(2).replace('.', ',')}
      </Text>
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
    marginRight: Spacing.md,
  },
  name: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  category: {
    fontSize: Typography.fontSize.sm,
  },
  separator: {
    fontSize: Typography.fontSize.sm,
    marginHorizontal: Spacing.xs,
  },
  source: {
    fontSize: Typography.fontSize.sm,
  },
  observation: {
    fontSize: Typography.fontSize.xs,
    marginTop: 4,
    fontStyle: 'italic',
  },
  amount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
});