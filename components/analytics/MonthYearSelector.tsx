// components/analytics/MonthYearSelector.tsx

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '@/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MonthYearSelectorProps {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MonthYearSelector({ year, month, onMonthChange }: MonthYearSelectorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handlePrevious = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNext = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Não permitir avançar além do mês atual
    if (year === currentYear && month === currentMonth) {
      return;
    }

    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  const isCurrentMonth = () => {
    const today = new Date();
    return year === today.getFullYear() && month === today.getMonth() + 1;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        onPress={handlePrevious}
        style={styles.button}
        activeOpacity={0.7}>
        <IconSymbol name="chevron.left" size={20} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.centerContent}>
        <Text style={[styles.monthText, { color: colors.text }]}>
          {MONTHS[month - 1]}
        </Text>
        <Text style={[styles.yearText, { color: colors.textSecondary }]}>
          {year}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleNext}
        style={[styles.button, isCurrentMonth() && styles.buttonDisabled]}
        activeOpacity={0.7}
        disabled={isCurrentMonth()}>
        <IconSymbol 
          name="chevron.right" 
          size={20} 
          color={isCurrentMonth() ? colors.textTertiary : colors.text} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  button: {
    padding: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  centerContent: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  yearText: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
});