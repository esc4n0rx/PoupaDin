import { useColorScheme } from '@/hooks/use-color-scheme';
import { CategoryAPI } from '@/services/api/category';
import { TransactionAPI } from '@/services/api/transaction';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { Category } from '@/types/category';
import { CreateTransactionDTO, Transaction } from '@/types/transaction';
import React, { useEffect, useState } from 'react';
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

interface IncomeModalProps {
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
  observation: string;
}

export function IncomeModal({
  visible,
  onClose,
  onSuccess,
  transaction,
}: IncomeModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isEditing = !!transaction;

  const [formData, setFormData] = useState<FormDataState>({
    name: '',
    category_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    observation: '',
  });

  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
      loadCategories();
      if (transaction) {
        setFormData({
          name: transaction.name,
          category_id: transaction.category_id,
          amount: transaction.amount.toString(),
          date: transaction.date,
          observation: transaction.observation || '',
        });
      } else {
        resetForm();
      }
    }
  }, [visible, transaction]);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await CategoryAPI.getCategories('income');

      if (response.success && response.data) {
        setIncomeCategories(response.data);
      }
    } catch (error) {
      console.error('Load categories error:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      observation: '',
    });
    setErrors({});
  };

  const updateField = (field: keyof FormDataState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao editar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Selecione uma categoria de receita';
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
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setToast({
        visible: true,
        message: 'Preencha todos os campos obrigatórios',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);

    try {
      const transactionData: CreateTransactionDTO = {
        name: formData.name,
        type: 'income',
        amount: parseFloat(formData.amount),
        date: formData.date,
        category_id: formData.category_id,
        observation: formData.observation || undefined,
      };

      let response;
      if (isEditing) {
        response = await TransactionAPI.updateTransaction(
          transaction.id,
          transactionData
        );
      } else {
        response = await TransactionAPI.createTransaction(transactionData);
      }

      if (response.success) {
        // Mostrar animação de sucesso
        setShowSuccess(true);
      } else {
        setToast({
          visible: true,
          message: response.error || 'Erro ao salvar receita',
          type: 'error',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Erro ao salvar receita. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    onSuccess();
    onClose();
  };

  return (
    <>
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
                <IconSymbol
                  name="chevron.right"
                  size={24}
                  color={colors.text}
                  style={{ transform: [{ rotate: '180deg' }] }}
                />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isEditing ? 'Editar Receita' : 'Nova Receita'}
</Text>
<View style={styles.headerRight} />
</View>        {isLoadingCategories ? (
          <Loader text="Carregando categorias..." />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Nome */}
            <View style={styles.section}>
              <Input
                label="Nome da Receita *"
                placeholder="Ex: Salário, Freelance..."
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                error={errors.name}
                maxLength={255}
              />
            </View>            {/* Categoria de Receita */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                Categoria de Receita *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}>
                {incomeCategories.map((category) => {
                  const isSelected = category.id === formData.category_id;                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        {
                          backgroundColor: isSelected
                            ? category.color
                            : colors.backgroundSecondary,
                          borderColor: isSelected
                            ? category.color
                            : colors.border,
                        },
                      ]}
                      onPress={() => updateField('category_id', category.id)}
                      activeOpacity={0.7}>
                      <IconSymbol
                        name={category.icon as any}
                        size={20}
                        color={isSelected ? '#FFFFFF' : category.color}
                      />
                      <Text
                        style={[
                          styles.categoryButtonText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.text,
                          },
                        ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {errors.category_id && (
                <Text style={[styles.error, { color: colors.error }]}>
                  {errors.category_id}
                </Text>
              )}
            </View>            {/* Valor */}
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
            </View>            {/* Data */}
            <View style={styles.section}>
              <DateInput
                label="Data *"
                value={formData.date}
                onChange={(date) => updateField('date', date)}
                error={errors.date}
                maximumDate={new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000)}
                minimumDate={new Date(Date.now() - 365 * 5 * 24 * 60 * 60 * 1000)}
              />
            </View>            {/* Observação */}
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
            </View>            {/* Botão Submit */}
            <View style={styles.buttonContainer}>
              <Button
                title={isEditing ? 'Salvar Alterações' : 'Registrar Receita'}
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
              />
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  </Modal>  {/* Success Animation */}
  <SuccessAnimation
    visible={showSuccess}
    message="Receita registrada! 💰"
    animationSource={require('../../assets/lottie/in.json')}
    onComplete={handleSuccessComplete}
  />
</>
);
}const styles = StyleSheet.create({
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
categoriesContainer: {
flexDirection: 'row',
gap: Spacing.sm,
paddingVertical: Spacing.xs,
},
categoryButton: {
flexDirection: 'row',
alignItems: 'center',
paddingHorizontal: Spacing.md,
paddingVertical: Spacing.sm,
borderRadius: BorderRadius.base,
borderWidth: 2,
gap: Spacing.xs,
},
categoryButtonText: {
fontSize: Typography.fontSize.sm,
fontWeight: Typography.fontWeight.medium,
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
buttonContainer: {
marginTop: Spacing.base,
},
});