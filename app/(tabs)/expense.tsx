import { DaySelector } from '@/components/navigation/DaySelector';
import { ThemedView } from '@/components/themed-view';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '@/theme';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ExpenseScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleAddExpense = () => {
    console.log('Adicionar nova despesa');
    // TODO: Implementar modal de adicionar despesa
  };

  return (
    <ThemedView style={styles.container}>
      <DaySelector onDayChange={setSelectedDate} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhuma despesa para este dia.
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            Toque no botão + para adicionar
          </Text>
        </View>
      </ScrollView>

      <FloatingActionButton onPress={handleAddExpense} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.base,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
  },
});