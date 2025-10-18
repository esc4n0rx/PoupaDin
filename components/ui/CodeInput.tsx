import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '../../theme';

interface CodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: string;
}

export function CodeInput({ length = 6, onComplete, error }: CodeInputProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<TextInput[]>([]);

  const handleChangeText = (text: string, index: number) => {
    // Apenas números
    if (text && !/^\d+$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus no próximo input
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Verificar se o código está completo
    if (newCode.every((digit) => digit !== '')) {
      onComplete(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Voltar para o input anterior ao pressionar backspace
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        {Array.from({ length }).map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: error
                  ? colors.error
                  : code[index]
                  ? colors.borderFocus
                  : colors.border,
                color: colors.text,
              },
            ]}
            maxLength={1}
            keyboardType="number-pad"
            value={code[index]}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            textAlign="center"
          />
        ))}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  input: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: BorderRadius.base,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  error: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});