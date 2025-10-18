import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { DateUtils } from '@/utils/date';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DateInputProps {
  label?: string;
  value: string; // ISO format (YYYY-MM-DD)
  onChange: (date: string) => void;
  error?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DateInput({
  label,
  value,
  onChange,
  error,
  placeholder = 'Selecione uma data',
  minimumDate,
  maximumDate,
}: DateInputProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [showPicker, setShowPicker] = useState(false);
  
  // Converter valor ISO para Date ou usar data padrão
  const getDateValue = (): Date => {
    if (value) {
      const date = new Date(value);
      // Ajustar para timezone local
      return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    }
    return new Date();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Android: fecha o picker automaticamente
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      // Converter para ISO format (YYYY-MM-DD) no timezone local
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      onChange(isoDate);
    } else if (event.type === 'dismissed') {
      // Usuário cancelou (Android)
      setShowPicker(false);
    }
  };

  const handlePress = () => {
    setShowPicker(true);
  };

  const handleIOSConfirm = () => {
    setShowPicker(false);
  };

  const displayValue = value
    ? DateUtils.formatToBrazilian(value)
    : placeholder;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.border,
          },
        ]}>
        <Text
          style={[
            styles.inputText,
            {
              color: value ? colors.text : colors.inputPlaceholder,
            },
          ]}>
          {displayValue}
        </Text>
      </TouchableOpacity>

      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}

      {/* iOS: Modal Picker */}
      {showPicker && Platform.OS === 'ios' && (
        <View style={styles.iosPickerContainer}>
          <View
            style={[
              styles.iosPickerModal,
              { backgroundColor: colors.backgroundSecondary },
            ]}>
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                style={styles.iosPickerButton}>
                <Text style={[styles.iosPickerButtonText, { color: colors.textSecondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleIOSConfirm}
                style={styles.iosPickerButton}>
                <Text style={[styles.iosPickerButtonText, { color: colors.primary }]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={getDateValue()}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              locale="pt-BR"
              textColor={colors.text}
            />
          </View>
        </View>
      )}

      {/* Android: Native Picker */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={getDateValue()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
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
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
  },
  inputText: {
    fontSize: Typography.fontSize.base,
    flex: 1,
  },
  error: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs,
  },
  iosPickerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  iosPickerModal: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xl,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  iosPickerButton: {
    padding: Spacing.sm,
  },
  iosPickerButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
});