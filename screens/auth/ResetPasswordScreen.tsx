import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ThemedView } from '../../components/themed-view';
import { Button } from '../../components/ui/Button';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { AuthAPI } from '../../services/api/auth';
import { supabase } from '../../services/supabase';
import { BorderRadius, Colors, Spacing, Typography } from '../../theme';
import { Validation } from '../../utils/validation';

export default function ResetPasswordScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    validateRecoveryToken();
  }, []);

  const validateRecoveryToken = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setToast({
          visible: true,
          message: 'Link inválido ou expirado. Solicite um novo.',
          type: 'error',
        });
        setIsValidToken(false);
        
        setTimeout(() => {
          router.replace('/auth/recovery');
        }, 3000);
        return;
      }

      setIsValidToken(true);
    } catch (error) {
      console.error('Error validating token:', error);
      setIsValidToken(false);
      setToast({
        visible: true,
        message: 'Erro ao validar link. Tente novamente.',
        type: 'error',
      });
      
      setTimeout(() => {
        router.replace('/auth/recovery');
      }, 3000);
    } finally {
      setIsValidating(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      newErrors.newPassword = 'Nova senha é obrigatória';
    } else {
      const passwordValidation = Validation.password(newPassword);
      if (!passwordValidation.valid) {
        newErrors.newPassword = passwordValidation.message || 'Senha inválida';
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua nova senha';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await AuthAPI.updatePassword(newPassword);

      if (result.success) {
        setToast({
          visible: true,
          message: 'Senha alterada com sucesso!',
          type: 'success',
        });

        setTimeout(() => {
          router.replace('/(tabs)');
        }, 2000);
      } else {
        setToast({
          visible: true,
          message: result.error || 'Erro ao alterar senha',
          type: 'error',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Erro ao alterar senha. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Validando link de recuperação...
          </Text>
        </View>
      </ThemedView>
    );
  }

  if (!isValidToken) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIcon, { backgroundColor: colors.error + '20' }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.error} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Link Inválido
          </Text>
          <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>
            Este link de recuperação é inválido ou expirou. Você será redirecionado para solicitar um novo.
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol name="checkmark.circle.fill" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Nova Senha
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Crie uma senha forte e segura para proteger sua conta
            </Text>
          </View>

          <View style={styles.form}>
            {/* Dicas de senha */}
            <View style={[styles.passwordTips, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Text style={[styles.passwordTipsTitle, { color: colors.text }]}>
                Sua senha deve conter:
              </Text>
              <View style={styles.tipItem}>
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Mínimo de 6 caracteres
                </Text>
              </View>
              <View style={styles.tipItem}>
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Combinação de letras e números
                </Text>
              </View>
              <View style={styles.tipItem}>
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Evite informações pessoais óbvias
                </Text>
              </View>
            </View>

            <Input
              label="Nova senha"
              placeholder="Digite sua nova senha"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setErrors({ ...errors, newPassword: undefined });
              }}
              error={errors.newPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <IconSymbol
                  name={showPassword ? 'house.fill' : 'house.fill'}
                  size={20}
                  color={colors.textSecondary}
                />
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Confirmar senha"
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors({ ...errors, confirmPassword: undefined });
              }}
              error={errors.confirmPassword}
              secureTextEntry={!showConfirmPassword}
              rightIcon={
                <IconSymbol
                  name={showConfirmPassword ? 'house.fill' : 'house.fill'}
                  size={20}
                  color={colors.textSecondary}
                />
              }
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button
              title="Redefinir Senha"
              onPress={handleResetPassword}
              loading={isLoading}
              disabled={isLoading}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.base,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.lg,
  },
  form: {
    gap: Spacing.base,
  },
  passwordTips: {
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    marginBottom: Spacing.base,
  },
  passwordTipsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  tipText: {
    fontSize: Typography.fontSize.sm,
    flex: 1,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});