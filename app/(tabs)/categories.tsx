// app/(tabs)/categories.tsx

import { CategoryCard } from '@/components/category/CategoryCard';
import { CategoryModal } from '@/components/modals/CategoryModal';
import { ThemedView } from '@/components/themed-view';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { Loader } from '@/components/ui/Loader';
import { Toast } from '@/components/ui/Toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CategoryAPI } from '@/services/api/category';
import { Colors, Spacing, Typography } from '@/theme';
import { Category, CategoryType, CategoryWithBudget } from '@/types/category';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CategoriesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [selectedTab, setSelectedTab] = useState<CategoryType>('expense');
  const [categories, setCategories] = useState<CategoryWithBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
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
    loadCategories();
  }, [selectedTab]);

  const loadCategories = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await CategoryAPI.getCategoriesWithBudget(selectedTab);

      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setToast({
          visible: true,
          message: response.error || 'Erro ao carregar categorias',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Load categories error:', error);
      setToast({
        visible: true,
        message: 'Erro ao carregar categorias',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCategories(true);
  }, [selectedTab]);

  const handleAddCategory = () => {
    setSelectedCategory(undefined);
    setModalVisible(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setModalVisible(true);
  };

  const handleModalSuccess = () => {
    loadCategories(true);
  };

  const incomeCategories = categories.filter((cat) => cat.type === 'income');
  const expenseCategories = categories.filter((cat) => cat.type === 'expense');

  const displayCategories = selectedTab === 'income' ? incomeCategories : expenseCategories;

  if (isLoading) {
    return <Loader fullScreen text="Carregando categorias..." />;
  }

  return (
    <ThemedView style={styles.container}>
      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'income' && {
              borderBottomColor: colors.success,
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => setSelectedTab('income')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === 'income' ? colors.success : colors.textSecondary,
                fontWeight: selectedTab === 'income' ? Typography.fontWeight.bold : Typography.fontWeight.medium,
              },
            ]}>
            Receitas ({incomeCategories.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'expense' && {
              borderBottomColor: colors.error,
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => setSelectedTab('expense')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === 'expense' ? colors.error : colors.textSecondary,
                fontWeight: selectedTab === 'expense' ? Typography.fontWeight.bold : Typography.fontWeight.medium,
              },
            ]}>
            Despesas ({expenseCategories.length})
          </Text>
        </TouchableOpacity>
      </View>

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
        {displayCategories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma categoria de {selectedTab === 'income' ? 'receita' : 'despesa'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Toque no botão + para criar uma
            </Text>
          </View>
        ) : (
          <View style={styles.categoriesList}>
            {displayCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={() => handleEditCategory(category)}
                onLongPress={() => handleEditCategory(category)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FloatingActionButton onPress={handleAddCategory} />

      <CategoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
        category={selectedCategory}
        initialType={selectedTab}
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabText: {
    fontSize: Typography.fontSize.base,
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
  categoriesList: {
    paddingBottom: Spacing['4xl'],
  },
});