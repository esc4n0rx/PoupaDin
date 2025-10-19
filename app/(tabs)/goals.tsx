// app/(tabs)/goals.tsx

import { GoalCard } from '@/components/goal/GoalCard';
import { AddBalanceModal } from '@/components/modals/AddBalanceModal';
import { GoalModal } from '@/components/modals/GoalModal';
import { ThemedView } from '@/components/themed-view';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { Loader } from '@/components/ui/Loader';
import { Toast } from '@/components/ui/Toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GoalAPI } from '@/services/api/goal';
import { Colors, Spacing, Typography } from '@/theme';
import { Goal, GoalWithProgress } from '@/types/goal';
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

export default function GoalsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>();
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
    loadGoals();
  }, []);

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
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadGoals(true);
  }, []);

  const handleAddGoal = () => {
    setSelectedGoal(undefined);
    setGoalModalVisible(true);
  };

  const handleGoalPress = (goal: Goal) => {
    // Tap simples - não faz nada por enquanto
    // O menu é aberto apenas com long press
  };

  const handleGoalLongPress = (goal: Goal) => {
    setSelectedGoal(goal);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Adicionar Saldo', 'Editar', 'Deletar'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 3,
          title: goal.name,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleAddBalance(goal);
          } else if (buttonIndex === 2) {
            handleEditGoal(goal);
          } else if (buttonIndex === 3) {
            handleDeleteGoal(goal);
          }
        }
      );
    } else {
      Alert.alert(
        goal.name,
        'Escolha uma ação',
        [
          { text: 'Adicionar Saldo', onPress: () => handleAddBalance(goal) },
          { text: 'Editar', onPress: () => handleEditGoal(goal) },
          {
            text: 'Deletar',
            onPress: () => handleDeleteGoal(goal),
            style: 'destructive',
          },
          { text: 'Cancelar', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };

  const handleAddBalance = (goal: Goal) => {
    setSelectedGoal(goal);
    setBalanceModalVisible(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setGoalModalVisible(true);
  };

  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert(
      'Deletar Objetivo',
      `Tem certeza que deseja deletar "${goal.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            const response = await GoalAPI.deleteGoal(goal.id);
            if (response.success) {
              setToast({
                visible: true,
                message: 'Objetivo deletado com sucesso!',
                type: 'success',
              });
              loadGoals(true);
            } else {
              setToast({
                visible: true,
                message: response.error || 'Erro ao deletar objetivo',
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  const handleModalSuccess = () => {
    loadGoals(true);
  };

  // Separar objetivos concluídos e em progresso
  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  if (isLoading) {
    return <Loader fullScreen text="Carregando objetivos..." />;
  }

  return (
    <ThemedView style={styles.container}>
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
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhum objetivo criado
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Toque no botão + para criar seu primeiro objetivo
            </Text>
          </View>
        ) : (
          <>
            {/* Objetivos em Progresso */}
            {activeGoals.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Em Progresso ({activeGoals.length})
                </Text>
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onPress={() => handleGoalPress(goal)}
                    onLongPress={() => handleGoalLongPress(goal)}
                  />
                ))}
              </View>
            )}

            {/* Objetivos Concluídos */}
            {completedGoals.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Concluídos ({completedGoals.length})
                </Text>
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onPress={() => handleGoalPress(goal)}
                    onLongPress={() => handleGoalLongPress(goal)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <FloatingActionButton onPress={handleAddGoal} icon="plus" />

      <GoalModal
        visible={goalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        onSuccess={handleModalSuccess}
        goal={selectedGoal}
      />

      {selectedGoal && (
        <AddBalanceModal
          visible={balanceModalVisible}
          onClose={() => setBalanceModalVisible(false)}
          onSuccess={handleModalSuccess}
          goal={selectedGoal}
        />
      )}

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
    paddingBottom: Spacing['5xl'],
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
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.md,
  },
});