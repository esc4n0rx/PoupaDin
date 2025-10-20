// app/(tabs)/analytics.tsx

import { AnalyticsSelector } from '@/components/analytics/AnalyticsSelector';
import { FlowChart } from '@/components/analytics/FlowChart';
import { MonthYearSelector } from '@/components/analytics/MonthYearSelector';
import { PieChart } from '@/components/analytics/PieChart';
import { TransactionList } from '@/components/analytics/TransactionList';
import { ThemedView } from '@/components/themed-view';
import { Loader } from '@/components/ui/Loader';
import { Toast } from '@/components/ui/Toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AnalyticsAPI } from '@/services/api/analytics';
import { Colors } from '@/theme';
import { AnalyticsViewType, MonthlyAnalytics, TransactionsByDay } from '@/types/analytics';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedView, setSelectedView] = useState<AnalyticsViewType>('expense_flow');

  const [analytics, setAnalytics] = useState<MonthlyAnalytics | null>(null);
  const [transactions, setTransactions] = useState<TransactionsByDay[]>([]);
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

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth, selectedView]);

  const getCurrentType = useCallback(() => {
    return selectedView.includes('income') ? 'income' : 'expense';
  }, [selectedView]);

  const isFlowView = useCallback(() => {
    return selectedView.includes('flow');
  }, [selectedView]);

  const loadData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const type = getCurrentType();

      const [analyticsResponse, transactionsResponse] = await Promise.all([
        AnalyticsAPI.getMonthlyAnalytics(selectedYear, selectedMonth, type),
        AnalyticsAPI.getTransactionsByDay(selectedYear, selectedMonth, type),
      ]);

      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data);
      } else {
        setToast({
          visible: true,
          message: analyticsResponse.error || 'Erro ao carregar análises',
          type: 'error',
        });
      }

      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data);
      }
    } catch (error) {
      console.error('Load analytics error:', error);
      setToast({
        visible: true,
        message: 'Erro ao carregar dados',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleViewChange = (view: AnalyticsViewType) => {
    setSelectedView(view);
  };

  const getChartColor = () => {
    return getCurrentType() === 'income' ? colors.success : colors.error;
  };

  const getChartTitle = () => {
    if (selectedView === 'income_flow') return 'Flow de Receitas';
    if (selectedView === 'expense_flow') return 'Flow de Despesas';
    if (selectedView === 'income_overview') return 'Overview de Receitas';
    return 'Overview de Despesas';
  };

  if (isLoading) {
    return <Loader fullScreen text="Carregando análises..." />;
  }

  return (
    <ThemedView style={styles.container}>
      <MonthYearSelector
        year={selectedYear}
        month={selectedMonth}
        onMonthChange={handleMonthChange}
      />

      <AnalyticsSelector
        selectedView={selectedView}
        onViewChange={handleViewChange}
      />

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
        {isFlowView() ? (
          <FlowChart
            data={analytics?.daily_flow || []}
            color={getChartColor()}
            title={getChartTitle()}
          />
        ) : (
          <PieChart
            data={analytics?.category_overview || []}
            title={getChartTitle()}
          />
        )}

        <TransactionList data={transactions} />
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
    paddingBottom: 100,
  },
});