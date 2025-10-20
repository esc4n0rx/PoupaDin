import { ExpenseModal } from '@/components/modals/ExpenseModal';
import { IncomeModal } from '@/components/modals/IncomeModal';
import { DaySelector } from '@/components/navigation/DaySelector';
import { ThemedView } from '@/components/themed-view';
import { DaySummary } from '@/components/transaction/DaySummary';
import { TransactionCard } from '@/components/transaction/TransactionCard';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { Loader } from '@/components/ui/Loader';
import { Toast } from '@/components/ui/Toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TransactionAPI } from '@/services/api/transaction';
import { Colors, Spacing, Typography } from '@/theme';
import { DaySummary as DaySummaryType, TransactionWithCategory } from '@/types/transaction';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ExpenseScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [summary, setSummary] = useState<DaySummaryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);

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
    loadTransactions();
  }, [selectedDate]);

  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadTransactions(true);
  }, [selectedDate]);

  const handleDayChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddTransaction = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Adicionar Despesa', 'Adicionar Receita'],
          cancelButtonIndex: 0,
          userInterfaceStyle: colorScheme,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setExpenseModalVisible(true);
          } else if (buttonIndex === 2) {
            setIncomeModalVisible(true);
          }
        }
      );
    } else {
      Alert.alert(
        'Adicionar Transação',
        'Escolha o tipo de transação que deseja adicionar:',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Despesa',
            onPress: () => setExpenseModalVisible(true),
          },
          {
            text: 'Receita',
            onPress: () => setIncomeModalVisible(true),
          },
        ]
      );
    }
  };

  const handleTransactionPress = (transaction: TransactionWithCategory) => {
    // TODO: Implementar edição de transação
    console.log('Edit transaction:', transaction.id);
  };

  const handleTransactionLongPress = (transaction: TransactionWithCategory) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Editar', 'Deletar'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          userInterfaceStyle: colorScheme,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {

            console.log('Edit:', transaction.id);
          } else if (buttonIndex === 2) {

            handleDeleteTransaction(transaction.id);
          }
        }
      );
    } else {
      Alert.alert(
        'Ações',
        `O que deseja fazer com ${transaction.name}?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Editar',
            onPress: () => console.log('Edit:', transaction.id),
          },
          {
            text: 'Deletar',
            onPress: () => handleDeleteTransaction(transaction.id),
            style: 'destructive',
          },
        ]
      );
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const response = await TransactionAPI.deleteTransaction(id);
      if (response.success) {
        setToast({
          visible: true,
          message: 'Transação deletada com sucesso!',
          type: 'success',
        });
        loadTransactions(true);
      } else {
        setToast({
          visible: true,
          message: response.error || 'Erro ao deletar transação',
          type: 'error',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Erro ao deletar transação',
        type: 'error',
      });
    }
  };

  const handleModalSuccess = () => {
    loadTransactions(true);
  };

  if (isLoading) {
    return <Loader fullScreen text="Carregando transações..." />;
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
        }
      >
        {summary && summary.transactions_count > 0 && (
          <DaySummary summary={summary} />
        )}

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma transação para este dia.
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Toque no botão + para adicionar
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onPress={() => handleTransactionPress(transaction)}
                onLongPress={() => handleTransactionLongPress(transaction)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FloatingActionButton onPress={handleAddTransaction} />

      <ExpenseModal
        visible={expenseModalVisible}
        onClose={() => setExpenseModalVisible(false)}
        onSuccess={handleModalSuccess}
      />

      <IncomeModal
        visible={incomeModalVisible}
        onClose={() => setIncomeModalVisible(false)}
        onSuccess={handleModalSuccess}
      />

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
  transactionsList: {
    paddingBottom: Spacing['4xl'],
  },
});
