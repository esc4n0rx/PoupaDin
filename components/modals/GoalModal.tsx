// components/modals/GoalModal.tsx

import { CATEGORY_COLORS } from '@/constants/categoryIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GoalAPI } from '@/services/api/goal';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { CreateGoalDTO, Goal, UpdateGoalDTO } from '@/types/goal';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../ui/Button';
import { ColorPicker } from '../ui/ColorPicker';
import { DateInput } from '../ui/DateInput';
import { IconSymbol } from '../ui/icon-symbol';
import { Input } from '../ui/Input';
import { Toast } from '../ui/Toast';

type GoalColor = typeof CATEGORY_COLORS[number];

// Ícones específicos para objetivos
const GOAL_ICONS = [
  'house.fill',
  'car.fill',
  'airplane',
  'heart.fill',
  'briefcase.fill',
  'gamecontroller.fill',
  'book.fill',
  'gift.fill',
  'star.fill',
  'cart.fill',
  'creditcard.fill',
  'dollarsign.circle.fill',
] as const;

interface FormDataState {
  name: string;
  target_amount: string;
  color: GoalColor;
  icon: typeof GOAL_ICONS[number];
  deadline: string;
}

interface GoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal?: Goal;
}

export function GoalModal({
  visible,
  onClose,
  onSuccess,
  goal,
}: GoalModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isEditing = !!goal;

  const [formData, setFormData] = useState<FormDataState>({
    name: '',
    target_amount: '',
    color: CATEGORY_COLORS[0],
    icon: GOAL_ICONS[0],
    deadline: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
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

  useEffect(() => {
    if (visible) {
      if (goal) {
        setFormData({
          name: goal.name,
          target_amount: goal.target_amount?.toString() || '',
          color: goal.color as GoalColor,
          icon: goal.icon as typeof GOAL_ICONS[number],
          deadline: goal.deadline || '',
        });
      } else {
        setFormData({
          name: '',
          target_amount: '',
          color: CATEGORY_COLORS[0],
          icon: GOAL_ICONS[0],
          deadline: '',
        });
      }
      setErrors({});
    }
  }, [visible, goal]);

  const updateField = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter no mínimo 3 caracteres';
    } else if (formData.name.trim().length > 255) {
      newErrors.name = 'Nome deve ter no máximo 255 caracteres';
    }

    if (formData.target_amount) {
      const amount = parseFloat(formData.target_amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.target_amount = 'Meta deve ser maior que zero';
      } else if (amount > 99999999.99) {
        newErrors.target_amount = 'Meta muito alta';
      }
    }

    if (formData.deadline) {
      const deadline = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadline < today) {
        newErrors.deadline = 'Prazo não pode ser no passado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const goalData: CreateGoalDTO | UpdateGoalDTO = {
        name: formData.name.trim(),
        target_amount: formData.target_amount
          ? parseFloat(formData.target_amount)
          : undefined,
        color: formData.color,
        icon: formData.icon,
        deadline: formData.deadline || undefined,
      };

      let response;
      if (isEditing && goal) {
        response = await GoalAPI.updateGoal(goal.id, goalData);
      } else {
        response = await GoalAPI.createGoal(goalData as CreateGoalDTO);
      }

      if (response.success) {
        setToast({
          visible: true,
          message: isEditing
            ? 'Objetivo atualizado com sucesso!'
            : 'Objetivo criado com sucesso!',
          type: 'success',
        });

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setToast({
          visible: true,
          message: response.error || 'Erro ao salvar objetivo',
          type: 'error',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Erro ao salvar objetivo. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [validate, formData, isEditing, goal, onSuccess, onClose]);

  const handleDelete = useCallback(async () => {
    if (!goal) return;

    setIsLoading(true);
    try {
      const response = await GoalAPI.deleteGoal(goal.id);

      if (response.success) {
        setToast({
          visible: true,
          message: 'Objetivo deletado com sucesso!',
          type: 'success',
        });

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setToast({
          visible: true,
          message: response.error || 'Erro ao deletar objetivo',
          type: 'error',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Erro ao deletar objetivo. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [goal, onSuccess, onClose]);

  const headerTitle = useMemo(
    () => (isEditing ? 'Editar Objetivo' : 'Novo Objetivo'),
    [isEditing]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="chevron.right" size={24} color={colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {headerTitle}
            </Text>
            <View style={styles.closeButton} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            {/* Nome */}
            <View style={styles.section}>
              <Input
                label="Nome do Objetivo"
                placeholder="Ex: Comprar um carro, Viagem..."
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                error={errors.name}
                maxLength={255}
              />
            </View>

            {/* Meta Financeira (Opcional) */}
            <View style={styles.section}>
              <Input
                label="Meta Financeira (Opcional)"
                placeholder="0.00"
                value={formData.target_amount}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  updateField('target_amount', cleaned);
                }}
                error={errors.target_amount}
                keyboardType="decimal-pad"
                leftIcon={
                  <Text style={[styles.currencySymbol, { color: colors.text }]}>
                    R$
                  </Text>
                }
              />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Defina um valor que deseja alcançar. Se não definir, o objetivo será apenas para acompanhamento do saldo acumulado.
              </Text>
            </View>

            {/* Prazo (Opcional) */}
            <View style={styles.section}>
              <DateInput
                label="Prazo (Opcional)"
                placeholder="Selecione uma data"
                value={formData.deadline}
                onChange={(date) => updateField('deadline', date)}
                error={errors.deadline}
                minimumDate={new Date()}
              />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Data limite para alcançar seu objetivo.
              </Text>
            </View>

            {/* Cor */}
            <View style={styles.section}>
              <ColorPicker
                selectedColor={formData.color}
                onColorSelect={(color) => updateField('color', color)}
              />
            </View>

            {/* Ícone */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Ícone</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconsContainer}>
                {GOAL_ICONS.map((icon) => {
                  const isSelected = formData.icon === icon;

                  return (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconButton,
                        {
                          backgroundColor: isSelected ? formData.color : colors.backgroundSecondary,
                          borderColor: isSelected ? formData.color : colors.border,
                        },
                      ]}
                      onPress={() => updateField('icon', icon)}
                      activeOpacity={0.7}>
                      <IconSymbol
                        name={icon as any}
                        size={24}
                        color={isSelected ? '#FFFFFF' : colors.text}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Saldo Atual (apenas na edição) */}
            {isEditing && goal && (
              <View style={[styles.currentBalanceBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <View style={styles.currentBalanceHeader}>
                  <Text style={[styles.currentBalanceLabel, { color: colors.text }]}>
                    Saldo Atual
                  </Text>
                  <Text
                    style={[
                      styles.currentBalanceValue,
                      { color: colors.success },
                    ]}>
                    R$ {goal.current_amount.toFixed(2)}
                  </Text>
                </View>
                <Text style={[styles.currentBalanceHelper, { color: colors.textSecondary }]}>
                  Use a opção "Adicionar Saldo" no menu do card para incrementar este valor
                </Text>
              </View>
            )}

            {/* Botões */}
            <View style={styles.buttonsContainer}>
              <Button
                title={isEditing ? 'Salvar Alterações' : 'Criar Objetivo'}
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
              />

              {isEditing && (
                <Button
                  title="Deletar Objetivo"
                  onPress={handleDelete}
                  variant="outline"
                  disabled={isLoading}
                  style={StyleSheet.flatten([
                    styles.deleteButton,
                    { borderColor: colors.error },
                  ])}
                />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.sm,
  },
  currencySymbol: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs,
    lineHeight: Typography.lineHeight.sm,
  },
  iconsContainer: {
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  currentBalanceBox: {
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  currentBalanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  currentBalanceLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  currentBalanceValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  currentBalanceHelper: {
    fontSize: Typography.fontSize.xs,
    lineHeight: Typography.lineHeight.sm,
  },
  buttonsContainer: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  deleteButton: {
    backgroundColor: 'transparent',
  },
});
