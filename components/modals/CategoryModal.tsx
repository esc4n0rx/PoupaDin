import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/constants/categoryIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CategoryAPI } from '@/services/api/category';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { Category, CategoryType, CreateCategoryDTO, UpdateCategoryDTO } from '@/types/category';
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
import { ColorPicker } from '../ui/ColorPicker';
import { IconSymbol } from '../ui/icon-symbol';
import { IconPicker } from '../ui/IconPicker';
import { Input } from '../ui/Input';
import { Toast } from '../ui/Toast';

// --- Início das Correções ---

// 1. Inferir tipos literais das constantes importadas
// (Assume-se que as constantes são exportadas com `as const`)
type CategoryColor = typeof CATEGORY_COLORS[number];
type CategoryIcon = typeof CATEGORY_ICONS[keyof typeof CATEGORY_ICONS][number];

// 2. Definir interface para o estado do formulário
interface FormDataState {
  name: string;
  type: CategoryType;
  icon: CategoryIcon;
  color: CategoryColor;
  monthly_budget: string;
}

// --- Fim das Correções Iniciais ---

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: Category;
  initialType?: CategoryType;
}

export function CategoryModal({
  visible,
  onClose,
  onSuccess,
  category,
  initialType = 'expense',
}: CategoryModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isEditing = !!category;

  // 3. Aplicar a interface FormDataState ao useState
  const [formData, setFormData] = useState<FormDataState>({
    name: '',
    type: initialType,
    icon: CATEGORY_ICONS[initialType][0],
    color: CATEGORY_COLORS[0],
    monthly_budget: '',
  });

  // 4. Corrigir tipo do estado de 'errors' (Erro 3)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
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
      if (category) {
        // Modo edição - preencher com dados existentes
        // 5. Aplicar type assertion para 'icon' e 'color' (Erro 1 e 2)
        setFormData({
          name: category.name,
          type: category.type,
          icon: category.icon as CategoryIcon, // Correção
          color: category.color as CategoryColor, // Correção
          monthly_budget: category.monthly_budget?.toString() || '',
        });
      } else {
        // Modo criação - resetar formulário
        setFormData({
          name: '',
          type: initialType,
          icon: CATEGORY_ICONS[initialType][0],
          color: CATEGORY_COLORS[0],
          monthly_budget: '',
        });
      }
      setErrors({});
    }
  }, [visible, category, initialType]);

  // 6. Melhorar tipagem de 'updateField'
  const updateField = (
    field: keyof FormDataState,
    value: FormDataState[keyof FormDataState]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Esta linha agora é válida graças à correção no useState de 'errors' (Erro 3)
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleTypeChange = (type: CategoryType) => {
    setFormData({
      ...formData,
      type,
      icon: CATEGORY_ICONS[type][0],
      monthly_budget: type === 'income' ? '' : formData.monthly_budget,
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter no mínimo 3 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    if (formData.type === 'expense' && formData.monthly_budget) {
      const budget = parseFloat(formData.monthly_budget);
      if (isNaN(budget) || budget <= 0) {
        newErrors.monthly_budget = 'Orçamento deve ser maior que zero';
      } else if (budget > 999999.99) {
        newErrors.monthly_budget = 'Orçamento muito alto';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const categoryData: CreateCategoryDTO | UpdateCategoryDTO = {
        name: formData.name.trim(),
        icon: formData.icon,
        color: formData.color,
        monthly_budget:
          formData.type === 'expense' && formData.monthly_budget
            ? parseFloat(formData.monthly_budget)
            : undefined,
      };

      let response;
      if (isEditing) {
        // Adicionado '!' pois 'isEditing' garante que 'category' existe
        response = await CategoryAPI.updateCategory(category!.id, categoryData);
      } else {
        response = await CategoryAPI.createCategory({
          ...categoryData,
          type: formData.type,
        } as CreateCategoryDTO);
      }

      if (response.success) {
        setToast({
          visible: true,
          message: isEditing
            ? 'Categoria atualizada com sucesso!'
            : 'Categoria criada com sucesso!',
          type: 'success',
        });

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setToast({
          visible: true,
          message: response.error || 'Erro ao salvar categoria',
          type: 'error',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Erro ao salvar categoria. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;

    setIsLoading(true);
    try {
      const response = await CategoryAPI.deleteCategory(category.id);

      if (response.success) {
        setToast({
          visible: true,
          message: 'Categoria deletada com sucesso!',
          type: 'success',
        });

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setToast({
          visible: true,
          message: response.error || 'Erro ao deletar categoria',
          type: 'error',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Erro ao deletar categoria. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
            </Text>
            <View style={styles.closeButton} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Tipo de Categoria (apenas na criação) */}
            {!isEditing && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  Tipo
                </Text>
                <View style={styles.typeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor:
                          formData.type === 'income'
                            ? colors.success
                            : colors.backgroundSecondary,
                        borderColor:
                          formData.type === 'income'
                            ? colors.success
                            : colors.border,
                      },
                    ]}
                    onPress={() => handleTypeChange('income')}
                    activeOpacity={0.7}>
                    <IconSymbol
                      name="arrow.down.circle.fill"
                      size={24}
                      color={
                        formData.type === 'income' ? '#FFFFFF' : colors.text
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        {
                          color:
                            formData.type === 'income'
                              ? '#FFFFFF'
                              : colors.text,
                        },
                      ]}>
                      Receita
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor:
                          formData.type === 'expense'
                            ? colors.error
                            : colors.backgroundSecondary,
                        borderColor:
                          formData.type === 'expense'
                            ? colors.error
                            : colors.border,
                      },
                    ]}
                    onPress={() => handleTypeChange('expense')}
                    activeOpacity={0.7}>
                    <IconSymbol
                      name="arrow.up.circle.fill"
                      size={24}
                      color={
                        formData.type === 'expense' ? '#FFFFFF' : colors.text
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        {
                          color:
                            formData.type === 'expense'
                              ? '#FFFFFF'
                              : colors.text,
                        },
                      ]}>
                      Despesa
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Nome */}
            <View style={styles.section}>
              <Input
                label="Nome da Categoria"
                placeholder="Ex: Alimentação, Salário..."
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                error={errors.name}
                maxLength={100}
              />
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
              <IconPicker
                selectedIcon={formData.icon}
                onIconSelect={(icon) => updateField('icon', icon)}
                categoryType={formData.type}
                categoryColor={formData.color}
              />
            </View>

            {/* Orçamento Mensal (apenas para despesas) */}
            {formData.type === 'expense' && (
              <View style={styles.section}>
                <Input
                  label="Orçamento Mensal (Opcional)"
                  placeholder="0.00"
                  value={formData.monthly_budget}
                  onChangeText={(text) => {
                    // Permitir apenas números e ponto decimal
                    const cleaned = text.replace(/[^0-9.]/g, '');
                    updateField('monthly_budget', cleaned);
                  }}
                  error={errors.monthly_budget}
                  keyboardType="decimal-pad"
                  leftIcon={
                    <Text style={[styles.currencySymbol, { color: colors.text }]}>
                      R$
                    </Text>
                  }
                />
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  Defina um limite de gastos mensal para esta categoria
                </Text>
              </View>
            )}

            {/* Botões */}
            <View style={styles.buttonsContainer}>
              <Button
                title={isEditing ? 'Salvar Alterações' : 'Criar Categoria'}
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
              />

              {isEditing && (
                <Button
                  title="Deletar Categoria"
                  onPress={handleDelete}
                  variant="outline"
                  disabled={isLoading}
                  // 7. Correção (Erro 4): Usar StyleSheet.flatten
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
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  typeButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
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
  buttonsContainer: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  deleteButton: {
    backgroundColor: 'transparent',
  },
});