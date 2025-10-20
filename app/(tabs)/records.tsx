// app/(tabs)/records.tsx

import { GoalCarousel } from '@/components/goal/GoalCarousel';
import { DaySelector } from '@/components/navigation/DaySelector';
import { ThemedView } from '@/components/themed-view';
import { DaySummary } from '@/components/transaction/DaySummary';
import { TransactionCard } from '@/components/transaction/TransactionCard';
import { Loader } from '@/components/ui/Loader';
import { Toast } from '@/components/ui/Toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GoalAPI } from '@/services/api/goal';
import { TransactionAPI } from '@/services/api/transaction';
import { Colors, Spacing, Typography } from '@/theme';
import { GoalWithProgress } from '@/types/goal';
import { DaySummary as DaySummaryType, TransactionWithCategory } from '@/types/transaction';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function RecordsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [summary, setSummary] = useState<DaySummaryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  // Carregar objetivos ao montar o componente
  useEffect(() => {
    loadGoals();
  }, []);

  // Carregar transações quando a data mudar
  useEffect(() => {
    loadTransactions();
  }, [selectedDate]);

  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadGoals = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await GoalAPI.getGoals();

      if (response.success && response.data) {
        setGoals(response.data);
      } else {
        setToast({
          visible: true,
          message: response.error || 'Erro ao carregar objetivos',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Load goals error:', error);
      setToast({
        visible: true,
        message: 'Erro ao carregar objetivos',
        type: 'error',
      });
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const loadTransactions = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const dateISO = formatDateToISO(selectedDate);
      const [transactionsResponse, summaryResponse] = await Promise.all([
        TransactionAPI.getTransactionsByDate(dateISO),
        TransactionAPI.getDaySummary(dateISO),
      ]);

      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data);
      } else {
        setToast({
          visible: true,
          message: transactionsResponse.error || 'Erro ao carregar transações',
          type: 'error',
        });
      }

      if (summaryResponse.success && summaryResponse.data) {
        setSummary(summaryResponse.data);
      }
    } catch (error) {
      console.error('Load transactions error:', error);
      setToast({
        visible: true,
        message: 'Erro ao carregar transações',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleDayChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadGoals(true);
    loadTransactions(true);
  }, [selectedDate]);

  if (isLoading) {
    return <Loader fullScreen text="Carregando registros..." />;
  }

  return (
    <ThemedView style={styles.container}>
      <DaySelector onDayChange={handleDayChange} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }>
        {/* Carrossel de Objetivos */}
        <GoalCarousel goals={goals} />

        {/* Resumo do Dia */}
        {summary && summary.transactions_count > 0 && <DaySummary summary={summary} />}

        {/* Lista de Transações */}
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhum registro para este dia.
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Adicione transações na aba Despesas
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onPress={() => {}}
                onLongPress={() => {}}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing['3xl'],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    marginTop: Spacing['2xl'],
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  transactionsList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
});