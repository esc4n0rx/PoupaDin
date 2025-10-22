import { useColorScheme } from '@/hooks/use-color-scheme';
import { CategoryAPI } from '@/services/api/category';
import { GoalAPI } from '@/services/api/goal';
import { TransactionAPI } from '@/services/api/transaction';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../ui/Button';
import { IconSymbol } from '../ui/icon-symbol';
import { SuccessAnimation } from '../ui/SuccessAnimation';
import { Toast } from '../ui/Toast';

interface RestoreDataModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ImportStats {
  categories: number;
  goals: number;
  transactions: number;
}

export function RestoreDataModal({ visible, onClose }: RestoreDataModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const parseCSVFile = (content: string) => {
    const lines = content.split('\n').map((l) => l.trim()).filter((l) => l);
    const data = {
      categories: [] as any[],
      goals: [] as any[],
      transactions: [] as any[],
    };

    let section = '';
    let headers: string[] = [];

    for (const line of lines) {
      if (line.startsWith('=== CATEGORIAS ===')) {
        section = 'categories';
        continue;
      } else if (line.startsWith('=== METAS ===')) {
        section = 'goals';
        continue;
      } else if (line.startsWith('=== TRANSAÇÕES ===')) {
        section = 'transactions';
        continue;
      } else if (
        line.startsWith('PoupaDin') ||
        line.startsWith('Usuário:') ||
        line.startsWith('Email:') ||
        line.startsWith('Data da Exportação:')
      ) {
        continue;
      }

      const values = parseCSVLine(line);

      if (section && values.length > 1) {
        if (line.includes('ID,Nome') || line.includes('ID,')) {
          headers = values;
        } else {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });

          if (section === 'categories') {
            data.categories.push({
              name: obj.Nome,
              type: obj.Tipo,
              icon: obj.Ícone || 'folder.fill',
              color: obj.Cor || '#3B82F6',
              budget_amount: obj.Orçamento ? parseFloat(obj.Orçamento) : null,
            });
          } else if (section === 'goals') {
            data.goals.push({
              name: obj.Nome,
              target_amount: parseFloat(obj['Valor Alvo']) || 0,
              current_amount: parseFloat(obj['Valor Atual']) || 0,
              deadline: obj['Data Limite'] || null,
            });
          } else if (section === 'transactions') {
            data.transactions.push({
              name: obj.Nome,
              type: obj.Tipo,
              amount: parseFloat(obj.Valor) || 0,
              date: obj.Data,
              categoryName: obj.Categoria,
              incomeCategoryName: obj['Categoria de Origem'],
              observation: obj.Observação || null,
            });
          }
        }
      }
    }

    return data;
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/comma-separated-values',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0].name);
        // Armazenar URI para uso posterior
        (result.assets[0] as any).tempUri = result.assets[0].uri;
        setToast({
          visible: true,
          message: 'Arquivo selecionado: ' + result.assets[0].name,
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Pick file error:', error);
      setToast({
        visible: true,
        message: 'Erro ao selecionar arquivo',
        type: 'error',
      });
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      setToast({
        visible: true,
        message: 'Selecione um arquivo primeiro',
        type: 'error',
      });
      return;
    }

    setIsRestoring(true);
    try {
      // Ler arquivo
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/comma-separated-values',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        throw new Error('Arquivo não selecionado');
      }

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);

      // Parse CSV
      const data = parseCSVFile(content);

      const stats: ImportStats = {
        categories: 0,
        goals: 0,
        transactions: 0,
      };

      // Importar categorias
      const categoryMap = new Map<string, string>(); // old name -> new id

      for (const cat of data.categories) {
        try {
          const response = await CategoryAPI.createCategory(cat);
          if (response.success && response.data) {
            categoryMap.set(cat.name, response.data.id);
            stats.categories++;
          }
        } catch (error) {
          console.error('Error importing category:', cat.name, error);
        }
      }

      // Importar metas
      for (const goal of data.goals) {
        try {
          const response = await GoalAPI.createGoal(goal);
          if (response.success) {
            stats.goals++;
          }
        } catch (error) {
          console.error('Error importing goal:', goal.name, error);
        }
      }

      // Importar transações
      for (const trans of data.transactions) {
        try {
          const categoryId = categoryMap.get(trans.categoryName);
          const incomeCategoryId = trans.incomeCategoryName
            ? categoryMap.get(trans.incomeCategoryName)
            : undefined;

          if (!categoryId) {
            console.warn('Category not found for transaction:', trans.name);
            continue;
          }

          const transactionData = {
            name: trans.name,
            type: trans.type,
            amount: trans.amount,
            date: trans.date,
            category_id: categoryId,
            income_category_id: incomeCategoryId,
            observation: trans.observation,
          };

          const response = await TransactionAPI.createTransaction(transactionData);
          if (response.success) {
            stats.transactions++;
          }
        } catch (error) {
          console.error('Error importing transaction:', trans.name, error);
        }
      }

      setImportStats(stats);
      setShowSuccess(true);
    } catch (error) {
      console.error('Restore error:', error);
      setToast({
        visible: true,
        message: 'Erro ao restaurar dados. Verifique o arquivo.',
        type: 'error',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    setSelectedFile(null);
    setImportStats(null);
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
              Restaurar Dados
            </Text>
            <View style={styles.headerRight} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
              <IconSymbol name="arrow.up.doc.fill" size={64} color={colors.success} />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Restaurar backup
            </Text>

            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Selecione o arquivo CSV exportado anteriormente para restaurar seus
              dados.
            </Text>

            {selectedFile && (
              <View
                style={[
                  styles.selectedFile,
                  { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                ]}>
                <IconSymbol name="doc.fill" size={20} color={colors.primary} />
                <Text style={[styles.fileName, { color: colors.primary }]}>
                  {selectedFile}
                </Text>
              </View>
            )}

            <View style={[styles.warningBox, { backgroundColor: colors.error + '20' }]}>
              <IconSymbol
                name="exclamationmark.triangle.fill"
                size={20}
                color={colors.error}
              />
              <Text style={[styles.warningText, { color: colors.error }]}>
                ATENÇÃO: A restauração irá adicionar os dados do backup aos seus dados
                atuais. Não irá substituir nem apagar dados existentes.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Selecionar Arquivo"
                onPress={handlePickFile}
                variant="outline"
                icon="folder.fill"
              />
              <Button
                title="Restaurar Dados"
                onPress={handleRestore}
                loading={isRestoring}
                disabled={!selectedFile || isRestoring}
                icon={isRestoring ? undefined : 'arrow.up.circle.fill'}
              />
            </View>
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
        message={
          importStats
            ? `Restaurado: ${importStats.categories} categorias, ${importStats.goals} metas, ${importStats.transactions} transações`
            : 'Dados restaurados com sucesso!'
        }
        animationSource={require('../../assets/lottie/success.json')}
        onComplete={handleSuccessComplete}
      />
    </>
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
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    marginBottom: Spacing.base,
    gap: Spacing.md,
  },
  fileName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
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
    lineHeight: Typography.lineHeight.md,
    fontWeight: Typography.fontWeight.medium,
  },
  buttonContainer: {
    gap: Spacing.md,
  },
});
