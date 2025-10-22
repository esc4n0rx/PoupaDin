import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CategoryAPI } from '@/services/api/category';
import { GoalAPI } from '@/services/api/goal';
import { TransactionAPI } from '@/services/api/transaction';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button } from '../ui/Button';
import { IconSymbol } from '../ui/icon-symbol';
import { SuccessAnimation } from '../ui/SuccessAnimation';
import { Toast } from '../ui/Toast';

interface ExportDataModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ExportDataModal({ visible, onClose }: ExportDataModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const generateCSV = async () => {
    setIsExporting(true);
    try {
      // Buscar todos os dados
      const [categoriesRes, goalsRes, transactionsRes] = await Promise.all([
        CategoryAPI.getCategories(),
        GoalAPI.getGoals(),
        TransactionAPI.getTransactions(),
      ]);

      if (!categoriesRes.success || !goalsRes.success || !transactionsRes.success) {
        throw new Error('Erro ao buscar dados');
      }

      const categories = categoriesRes.data || [];
      const goals = goalsRes.data || [];
      const transactions = transactionsRes.data || [];

      let csvContent = '';

      csvContent += `PoupaDin - Exportação de Dados\n`;
      csvContent += `Usuário: ${escapeCSV(user?.full_name)}\n`;
      csvContent += `Email: ${escapeCSV(user?.email)}\n`;
      csvContent += `Data da Exportação: ${new Date().toISOString()}\n`;
      csvContent += `\n`;

      csvContent += `=== CATEGORIAS ===\n`;
      csvContent += `ID,Nome,Tipo,Ícone,Cor,Orçamento,Data de Criação\n`;
      categories.forEach((cat:any) => {
        csvContent += `${escapeCSV(cat.id)},${escapeCSV(cat.name)},${escapeCSV(cat.type)},${escapeCSV(cat.icon)},${escapeCSV(cat.color)},${escapeCSV(cat.budget_amount || '')},${escapeCSV(cat.created_at)}\n`;
      });
      csvContent += `\n`;

      csvContent += `=== METAS ===\n`;
      csvContent += `ID,Nome,Valor Alvo,Valor Atual,Data Limite,Status,Data de Criação\n`;
      goals.forEach((goal:any) => {
        csvContent += `${escapeCSV(goal.id)},${escapeCSV(goal.name)},${escapeCSV(goal.target_amount)},${escapeCSV(goal.current_amount)},${escapeCSV(goal.deadline || '')},${escapeCSV(goal.is_completed ? 'Concluída' : 'Em andamento')},${escapeCSV(goal.created_at)}\n`;
      });
      csvContent += `\n`;

      csvContent += `=== TRANSAÇÕES ===\n`;
      csvContent += `ID,Nome,Tipo,Valor,Data,Categoria,Categoria de Origem,Observação,Data de Criação\n`;
      transactions.forEach((trans:any) => {
        const category = categories.find((c) => c.id === trans.category_id);
        const incomeCategory = trans.income_category_id
          ? categories.find((c) => c.id === trans.income_category_id)
          : null;
        csvContent += `${escapeCSV(trans.id)},${escapeCSV(trans.name)},${escapeCSV(trans.type)},${escapeCSV(trans.amount)},${escapeCSV(trans.date)},${escapeCSV(category?.name || '')},${escapeCSV(incomeCategory?.name || '')},${escapeCSV(trans.observation || '')},${escapeCSV(trans.created_at)}\n`;
      });

      // Salvar arquivo
      const fileName = `poupadin_backup_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      // Compartilhar arquivo
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar dados PoupaDin',
          UTI: 'public.comma-separated-values-text',
        });
        setShowSuccess(true);
      } else {
        setToast({
          visible: true,
          message: 'Arquivo salvo em: ' + fileUri,
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      setToast({
        visible: true,
        message: 'Erro ao exportar dados. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
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
              Exportar Registros
            </Text>
            <View style={styles.headerRight} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol
                name="arrow.down.doc.fill"
                size={64}
                color={colors.primary}
              />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Backup dos seus dados
            </Text>

            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Exporte todos os seus dados para um arquivo CSV. Este arquivo contém:
            </Text>

            <View style={styles.featureList}>
              <FeatureItem
                icon="folder.fill"
                text="Todas as categorias criadas"
                colors={colors}
              />
              <FeatureItem icon="target" text="Todas as metas" colors={colors} />
              <FeatureItem
                icon="list.bullet.rectangle"
                text="Todas as transações"
                colors={colors}
              />
              <FeatureItem
                icon="checkmark.shield.fill"
                text="Dados seguros e organizados"
                colors={colors}
              />
            </View>

            <View style={[styles.warningBox, { backgroundColor: colors.warning + '20' }]}>
              <IconSymbol
                name="exclamationmark.triangle.fill"
                size={20}
                color={colors.warning}
              />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                Guarde este arquivo em um local seguro. Você pode usá-lo para
                restaurar seus dados.
              </Text>
            </View>

            <Button
              title="Exportar Dados"
              onPress={generateCSV}
              loading={isExporting}
              disabled={isExporting}
              icon={isExporting ? undefined : 'arrow.down.circle.fill'}
            />
          </ScrollView>

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
        message="Dados exportados com sucesso!"
        animationSource={require('../../assets/lottie/success.json')}
        onComplete={handleSuccessComplete}
      />
    </>
  );
}

function FeatureItem({
  icon,
  text,
  colors,
}: {
  icon: any;
  text: string;
  colors: any;
}) {
  return (
    <View style={styles.featureItem}>
      <IconSymbol name={icon} size={20} color={colors.primary} />
      <Text style={[styles.featureText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  content: {
    padding: Spacing.base,
    paddingTop: Spacing['2xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeight.lg,
  },
  featureList: {
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  featureText: {
    fontSize: Typography.fontSize.base,
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight['2xl'],
  },
});
