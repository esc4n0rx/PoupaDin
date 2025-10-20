import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { Category } from '@/types/category';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategorySelector = React.memo(
  ({ categories, selectedCategoryId, onSelectCategory }: CategorySelectorProps) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => {
          const isSelected = category.id === selectedCategoryId;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: isSelected
                    ? category.color
                    : colors.backgroundSecondary,
                  borderColor: isSelected ? category.color : colors.border,
                },
              ]}
              onPress={() => onSelectCategory(category.id)}
              activeOpacity={0.7}
            >
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
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }
);

const styles = StyleSheet.create({
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
});
