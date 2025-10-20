// components/analytics/AnalyticsSelector.tsx

import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { AnalyticsViewType } from '@/types/analytics';
import { SymbolViewProps } from 'expo-symbols';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';

interface AnalyticsSelectorProps {
  selectedView: AnalyticsViewType;
  onViewChange: (view: AnalyticsViewType) => void;
}

const VIEW_OPTIONS: { value: AnalyticsViewType; label: string; icon: SymbolViewProps['name'] }[] = [
  { value: 'income_flow', label: 'Flow de Receitas', icon: 'arrow.up.circle.fill' },
  { value: 'expense_flow', label: 'Flow de Despesas', icon: 'arrow.down.circle.fill' },
  { value: 'income_overview', label: 'Overview de Receitas', icon: 'chart.pie.fill' },
  { value: 'expense_overview', label: 'Overview de Despesas', icon: 'chart.pie.fill' },
];

export function AnalyticsSelector({ selectedView, onViewChange }: AnalyticsSelectorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = VIEW_OPTIONS.find(opt => opt.value === selectedView);

  const handleSelect = (view: AnalyticsViewType) => {
    onViewChange(view);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}>
        <View style={styles.selectorContent}>
          <IconSymbol name={selectedOption?.icon || 'chart.bar.fill'} size={20} color={colors.text} />
          <Text style={[styles.selectorText, { color: colors.text }]}>
            {selectedOption?.label}
          </Text>
        </View>
        <IconSymbol name="chevron.down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Selecione a visualização
              </Text>
            </View>

            <ScrollView>
              {VIEW_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    { borderBottomColor: colors.border },
                    option.value === selectedView && { backgroundColor: colors.background },
                  ]}
                  onPress={() => handleSelect(option.value)}
                  activeOpacity={0.7}>
                  <View style={styles.optionContent}>
                    <IconSymbol name={option.icon} size={22} color={colors.text} />
                    <Text style={[styles.optionText, { color: colors.text }]}>
                      {option.label}
                    </Text>
                  </View>
                  {option.value === selectedView && (
                    <IconSymbol name="checkmark" size={20} color={colors.success} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  selectorText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
});