import { useColorScheme } from '@/hooks/use-color-scheme';
import { CategoryAPI } from '@/services/api/category';
import { TransactionAPI } from '@/services/api/transaction';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { Category } from '@/types/category';
import { CreateTransactionDTO, Transaction } from '@/types/transaction';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { DateInput } from '../ui/DateInput';
import { IconSymbol } from '../ui/icon-symbol';
import { Input } from '../ui/Input';
import { Loader } from '../ui/Loader';
import { SuccessAnimation } from '../ui/SuccessAnimation';
import { Toast } from '../ui/Toast';
import { CategorySelector } from './CategorySelector';

interface ExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction;
}

interface FormDataState {
  name: string;
  category_id: string;
  amount: string;
  date: string;
  income_category_id: string;
  observation: string;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

export const ExpenseModal = React.memo(
  ({ visible, onClose, onSuccess, transaction }: ExpenseModalProps) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const isEditing = !!transaction;

    const [formData, setFormData] = useState<FormDataState>({
      name: '',
      category_id: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      income_category_id: '',
      observation: '',
    });

    const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
    const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [budgetWarning, setBudgetWarning] = useState<string>('');
    const [toast, setToast] = useState<ToastState>({
      visible: false,
      message: '',
      type: 'success',
    });

    useEffect(() => {
      if (visible) {
        loadCategories();
        if (transaction) {
          setFormData({
            name: transaction.name,
            category_id: transaction.category_id,
            amount: transaction.amount.toString(),
            date: transaction.date,
            income_category_id: transaction.income_category_id || '',
            observation: transaction.observation || '',
          });
        } else {
          resetForm();
        }
      }
    }, [visible, transaction]);

    useEffect(() => {
      if (formData.category_id && formData.amount && parseFloat(formData.amount) > 0) {
        validateBudget();
      } else {
        setBudgetWarning('');
      }
    }, [formData.category_id, formData.amount, formData.date]);

    const loadCategories = useCallback(async () => {
      setIsLoadingCategories(true);
      try {
        const [expenseResponse, incomeResponse] = await Promise.all([
          CategoryAPI.getCategoriesWithBudget('expense'),
          CategoryAPI.getCategories('income'),
        ]);
        if (expenseResponse.success && expenseResponse.data) {
          setExpenseCategories(expenseResponse.data);
        }
        if (incomeResponse.success && incomeResponse.data) {
          setIncomeCategories(incomeResponse.data);
        }
      } catch (error) {
        console.error('Load categories error:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    }, []);

    const validateBudget = useCallback(async () => {
      try {
        const amount = parseFloat(formData.amount);
        const response = await TransactionAPI.validateBudget(
          formData.category_id,
          amount,
          formData.date
        );
        if (response.success && response.data) {
          const validation = response.data;
          if (!validation.isValid && validation.error_message) {
            setBudgetWarning(validation.error_message);
          } else if (validation.budget_amount && validation.spent_amount !== undefined) {
            setBudgetWarning(
              `Orçamento: R$ ${validation.spent_amount.toFixed(2)} / R$ ${validation.budget_amount.toFixed(2)}`
            );
          } else {
            setBudgetWarning('');
          }
        }
      } catch (error) {
        console.error('Validate budget error:', error);
      }
    }, [formData.amount, formData.category_id, formData.date]);

    const resetForm = useCallback(() => {
      setFormData({
        name: '',
        category_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        income_category_id: '',
        observation: '',
      });
      setErrors({});
      setBudgetWarning('');
    }, []);

    const updateField = useCallback((field: keyof FormDataState, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    }, [errors]);

    const validate = useCallback((): boolean => {
      const newErrors: { [key: string]: string } = {};
      if (!formData.name.trim()) {
        newErrors.name = 'Nome é obrigatório';
      }
      if (!formData.category_id) {
        newErrors.category_id = 'Selecione uma categoria de despesa';
      }
      if (!formData.income_category_id) {
        newErrors.income_category_id = 'Selecione a fonte da despesa';
      }
      const amount = parseFloat(formData.amount);
      if (!formData.amount || isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Valor deve ser maior que zero';
      }
      if (!formData.date) {
        newErrors.date = 'Data é obrigatória';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = useCallback(async () => {
      if (!validate()) {
        setToast({
          visible: true,
          message: 'Preencha todos os campos obrigatórios',
          type: 'error',
        });
        return;
      }

      if (budgetWarning.includes('ultrapassaria')) {
        setToast({
          visible: true,
          message: 'Esta despesa excede o orçamento da categoria',
          type: 'error',
        });
        return;
      }

      setIsLoading(true);
      try {
        const transactionData: CreateTransactionDTO = {
          name: formData.name,
          type: 'expense',
          amount: parseFloat(formData.amount),
          date: formData.date,
          category_id: formData.category_id,
          income_category_id: formData.income_category_id,
          observation: formData.observation || undefined,
        };

        let response;
        if (isEditing && transaction) {
          response = await TransactionAPI.updateTransaction(
            transaction.id,
            transactionData
          );
        } else {
          response = await TransactionAPI.createTransaction(transactionData);
        }

        if (response.success) {
          setShowSuccess(true);
        } else {
          setToast({
            visible: true,
            message: response.error || 'Erro ao salvar despesa',
            type: 'error',
          });
        }
      } catch (error) {
        setToast({
          visible: true,
          message: 'Erro ao salvar despesa. Tente novamente.',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    }, [validate, budgetWarning, formData, isEditing, transaction]);

    const handleSuccessComplete = useCallback(() => {
      setShowSuccess(false);
      onSuccess();
      onClose();
    }, [onSuccess, onClose]);

    const headerTitle = useMemo(
      () => (isEditing ? 'Editar Despesa' : 'Nova Despesa'),
      [isEditing]
    );

    return (
      <>
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={onClose}
        >
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardView}
            >
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <IconSymbol
                    name="chevron.right"
                    size={24}
                    color={colors.text}
                    style={{ transform: [{ rotate: '180deg' }] }}
                  />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {headerTitle}
                </Text>
                <View style={styles.headerRight} />
              </View>

              {isLoadingCategories ? (
                <Loader text="Carregando categorias..." />
              ) : (
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.section}>
                    <Input
                      label="Nome da Despesa *"
                      placeholder="Ex: Compras no mercado"
                      value={formData.name}
                      onChangeText={(text) => updateField('name', text)}
                      error={errors.name}
                      maxLength={255}
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      Categoria de Despesa *
                    </Text>
                    <CategorySelector
                      categories={expenseCategories}
                      selectedCategoryId={formData.category_id}
                      onSelectCategory={(id) => updateField('category_id', id)}
                    />
                    {errors.category_id && (
                      <Text style={[styles.error, { color: colors.error }]}>
                        {errors.category_id}
                      </Text>
                    )}
                  </View>

                  <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      Fonte (de onde vem o dinheiro) *
                    </Text>
                    <CategorySelector
                      categories={incomeCategories}
                      selectedCategoryId={formData.income_category_id}
                      onSelectCategory={(id) => updateField('income_category_id', id)}
                    />
                    {errors.income_category_id && (
                      <Text style={[styles.error, { color: colors.error }]}>
                        {errors.income_category_id}
                      </Text>
                    )}
                  </View>

                  <View style={styles.section}>
                    <Input
                      label="Valor *"
                      placeholder="0.00"
                      value={formData.amount}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9.]/g, '');
                        const parts = cleaned.split('.');
                        const formatted =
                          parts.length > 2
                            ? `${parts[0]}.${parts.slice(1).join('')}`
                            : cleaned;
                        updateField('amount', formatted);
                      }}
                      error={errors.amount}
                      keyboardType="decimal-pad"
                      leftElement={
                        <Text style={[styles.currencySymbol, { color: colors.text }]}>
                          R$
                        </Text>
                      }
                    />
                    {budgetWarning && (
                      <View
                        style={[
                          styles.budgetWarningBox,
                          {
                            backgroundColor: budgetWarning.includes('ultrapassaria')
                              ? colors.error + '20'
                              : colors.primary + '20',
                            borderColor: budgetWarning.includes('ultrapassaria')
                              ? colors.error
                              : colors.primary,
                          },
                        ]}
                      >
                        <IconSymbol
                          name={
                            budgetWarning.includes('ultrapassaria')
                              ? 'exclamationmark.triangle.fill'
                              : 'info.circle.fill'
                          }
                          size={16}
                          color={
                            budgetWarning.includes('ultrapassaria')
                              ? colors.error
                              : colors.primary
                          }
                        />
                        <Text
                          style={[
                            styles.budgetWarningText,
                            {
                              color: budgetWarning.includes('ultrapassaria')
                                ? colors.error
                                : colors.primary,
                            },
                          ]}
                        >
                          {budgetWarning}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.section}>
                    <DateInput
                      label="Data *"
                      value={formData.date}
                      onChange={(date) => updateField('date', date)}
                      error={errors.date}
                      maximumDate={new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000)}
                      minimumDate={new Date(Date.now() - 365 * 5 * 24 * 60 * 60 * 1000)}
                    />
                  </View>

                  <View style={styles.section}>
                    <Input
                      label="Observação (Opcional)"
                      placeholder="Adicione uma observação..."
                      value={formData.observation}
                      onChangeText={(text) => updateField('observation', text)}
                      multiline
                      numberOfLines={3}
                      maxLength={500}
                    />
                  </View>

                  <View style={styles.buttonContainer}>
                    <Button
                      title={isEditing ? 'Salvar Alterações' : 'Registrar Despesa'}
                      onPress={handleSubmit}
                      loading={isLoading}
                      disabled={isLoading || budgetWarning.includes('ultrapassaria')}
                    />
                  </View>
                </ScrollView>
              )}
            </KeyboardAvoidingView>
            <Toast
              visible={toast.visible}
              message={toast.message}
              type={toast.type}
              onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
            />
          </View>
        </Modal>
        <SuccessAnimation
          visible={showSuccess}
          message="Despesa registrada! 💸"
          animationSource={require('../../assets/lottie/out.json')}
          onComplete={handleSuccessComplete}
        />
      </>
    );
  }
);

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
  headerRight: {
    width: 40,
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
  error: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs,
  },
  currencySymbol: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    marginRight: Spacing.xs,
  },
  budgetWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  budgetWarningText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    lineHeight: Typography.lineHeight.sm,
  },
  buttonContainer: {
    marginTop: Spacing.base,
  },
});
