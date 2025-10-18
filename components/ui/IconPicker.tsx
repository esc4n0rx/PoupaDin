// components/ui/IconPicker.tsx

import { CATEGORY_ICONS } from '@/constants/categoryIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { CategoryType } from '@/types/category';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './icon-symbol';

interface IconPickerProps {
  selectedIcon: string;
  onIconSelect: (icon: string) => void;
  categoryType: CategoryType;
  categoryColor: string;
  label?: string;
}

export function IconPicker({
  selectedIcon,
  onIconSelect,
  categoryType,
  categoryColor,
  label = 'Ícone',
}: IconPickerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const icons = CATEGORY_ICONS[categoryType];

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.iconsContainer}>
        {icons.map((icon) => {
          const isSelected = selectedIcon === icon;
          
          return (
            <TouchableOpacity
              key={icon}
              style={[
                styles.iconButton,
                {
                  backgroundColor: isSelected ? categoryColor : colors.backgroundSecondary,
                  borderColor: isSelected ? categoryColor : colors.border,
                },
              ]}
              onPress={() => onIconSelect(icon)}
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
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.sm,
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
});