// components/modals/AddBalanceModal.tsx

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GoalAPI } from '@/services/api/goal';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { Goal } from '@/types/goal';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../ui/Button';
import { IconSymbol } from '../ui/icon-symbol';
import { Input } from '../ui/Input';
import { Toast } from '../ui/Toast';

interface AddBalanceModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: Goal;
}

export function AddBalanceModal({
  visible,
  onClose,
  onSuccess,
  goal,
}: AddBalanceModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
    setError('');
  };

  const validate = (): boolean => {
    if (!amount) {
      setError('Valor é obrigatório');
      return false;
    }

    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setError('Valor deve ser maior que zero');
      return false;
    }

    if (value > 99999999.99) {
      setError('Valor muito alto');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await GoalAPI.addBalance(goal.id, {
        amount: parseFloat(amount),
      });

      if (response.success) {
        setToast({
          visible: true,
          message: 'Saldo adicionado com sucesso!',
          type: 'success',
        });

        setTimeout(() => {
          onSuccess();
          onClose();
          setAmount('');
        }, 1500);
      } else {
        setToast({
          visible: true,
          message: response.error || 'Erro ao adicionar saldo',
          type: 'error',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Erro ao adicionar saldo. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const getNewTotal = () => {
    const value = parseFloat(amount);
    if (isNaN(value)) return goal.current_amount;
    return goal.current_amount + value;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={styles.modalWrapper}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Adicionar Saldo
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <IconSymbol name="xmark" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                {/* Goal Info */}
                <View style={[styles.goalInfo, { backgroundColor: colors.backgroundSecondary }]}>
                  <View style={[styles.goalIcon, { backgroundColor: goal.color }]}>
                    <IconSymbol
                      name={goal.icon as any}
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.goalDetails}>
                    <Text style={[styles.goalName, { color: colors.text }]} numberOfLines={1}>
                      {goal.name}
                    </Text>
                    <Text style={[styles.currentAmount, { color: colors.textSecondary }]}>
                      Saldo atual: {formatCurrency(goal.current_amount)}
                    </Text>
                  </View>
                </View>

                {/* Amount Input */}
                <View style={styles.inputSection}>
                  <Input
                    label="Valor a adicionar"
                    placeholder="0.00"
                    value={amount}
                    onChangeText={handleAmountChange}
                    error={error}
                    keyboardType="decimal-pad"
                    autoFocus
                    leftIcon={
                      <Text style={[styles.currencySymbol, { color: colors.text }]}>
                        R$
                      </Text>
                    }
                  />
                </View>

                {/* Preview */}
                {amount && !error && parseFloat(amount) > 0 && (
                  <View style={[styles.preview, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                      Novo saldo total
                    </Text>
                    <Text style={[styles.previewValue, { color: colors.success }]}>
                      {formatCurrency(getNewTotal())}
                    </Text>
                    
                    {goal.target_amount && (
                      <Text style={[styles.previewHelper, { color: colors.textSecondary }]}>
                        Meta: {formatCurrency(goal.target_amount)}
                        {getNewTotal() >= goal.target_amount && (
                          <Text style={{ color: colors.success }}> ✓ Meta atingida!</Text>
                        )}
                      </Text>
                    )}
                  </View>
                )}

                {/* Quick Values */}
                <View style={styles.quickValues}>
                  <Text style={[styles.quickValuesLabel, { color: colors.textSecondary }]}>
                    Valores rápidos
                  </Text>
                  <View style={styles.quickValuesRow}>
                    {[10, 20, 50, 100, 200, 500].map((value) => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.quickValueButton,
                          { 
                            backgroundColor: colors.backgroundSecondary,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => setAmount(value.toString())}
                        activeOpacity={0.7}>
                        <Text style={[styles.quickValueText, { color: colors.text }]}>
                          R$ {value}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Submit Button */}
                <Button
                  title="Adicionar Saldo"
                  onPress={handleSubmit}
                  loading={isLoading}
                  disabled={isLoading || !amount || !!error}
                />
              </View>

              <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast({ ...toast, visible: false })}
              />
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalWrapper: {
    width: '90%',
    maxWidth: 500,
  },
  container: {
    borderRadius: BorderRadius.xl,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    width: 32,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.lg,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  goalDetails: {
    flex: 1,
  },
  goalName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: 2,
  },
  currentAmount: {
    fontSize: Typography.fontSize.sm,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  currencySymbol: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  preview: {
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  previewLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  previewValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  previewHelper: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
  },
  quickValues: {
    marginBottom: Spacing.lg,
  },
  quickValuesLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.sm,
  },
  quickValuesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickValueButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
  },
  quickValueText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});