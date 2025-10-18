import { router } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedView } from '../../components/themed-view';
import { Button } from '../../components/ui/Button';
import { CodeInput } from '../../components/ui/CodeInput';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { AuthAPI } from '../../services/api/auth';
import { Colors, Spacing, Typography } from '../../theme';
import { Validation } from '../../utils/validation';

type Step = 'email' | 'code' | 'password';

export default function RecoveryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const handleRequestCode = async () => {
    if (!email) {
      setErrors({ email: 'E-mail é obrigatório' });
      return;
    }
    if (!Validation.email(email)) {
      setErrors({ email: 'E-mail inválido' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await AuthAPI.requestRecovery({ email });

      if (response.success) {
        setToast({
          visible: true,
          message: 'Código enviado para seu e-mail!',
          type: 'success',
        });
        setCurrentStep('code');
      } else {
        setToast({
          visible: true,
          message: response.error || 'Erro ao enviar código',
          type: 'error',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Erro ao enviar código. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (verificationCode: string) => {
    setCode(verificationCode);
    setIsLoading(true);

    try {
      const response = await AuthAPI.verifyRecoveryCode({
        email,
        code: verificationCode,
      });

      if (response.success) {
        setToast({
          visible: true,
          message: 'Código verificado!',
          type: 'success',
        });
        setCurrentStep('password');
      } else {
        setToast({
          visible: true,
          message: response.error || 'Código inválido',
          type: 'error',
        });
        setCode('');
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Erro ao verificar código. Tente novamente.',
        type: 'error',
      });
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newErrors: Record<string, string> = {};

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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await AuthAPI.resetPassword({
        email,
        code,
        new_password: newPassword,
      });

      if (response.success) {
        setToast({
          visible: true,
          message: 'Senha alterada com sucesso!',
          type: 'success',
        });
        
        setTimeout(() => {
          router.replace('/auth/login');
        }, 2000);
      } else {
        setToast({
          visible: true,
          message: response.error || 'Erro ao resetar senha',
          type: 'error',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Erro ao resetar senha. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'email') {
      router.back();
    } else if (currentStep === 'code') {
      setCurrentStep('email');
      setCode('');
    } else {
      setCurrentStep('code');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'email':
        return (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              Recuperar senha
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Digite seu e-mail para receber um código de verificação
            </Text>

            <Input
              label="E-mail"
              placeholder="exemplo@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({});
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button
              title="Enviar código"
              onPress={handleRequestCode}
              loading={isLoading}
              disabled={isLoading}
            />
          </>
        );

      case 'code':
        return (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              Digite o código
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Enviamos um código de 6 dígitos para {email}
            </Text>
            <View style={styles.codeContainer}>
              <CodeInput
                length={6}
                onComplete={handleVerifyCode}
                error={errors.code}
              />
            </View>

            <TouchableOpacity
              onPress={handleRequestCode}
              style={styles.resendButton}
              disabled={isLoading}>
              <Text style={[styles.resendText, { color: colors.primary }]}>
                Reenviar código
              </Text>
            </TouchableOpacity>
          </>
        );

      case 'password':
        return (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              Nova senha
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Crie uma nova senha segura para sua conta
            </Text>

            <Input
              label="Nova senha"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setErrors({ ...errors, newPassword: undefined });
              }}
              error={errors.newPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={colors.textSecondary}
                />
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
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
                  name="chevron.right"
                  size={20}
                  color={colors.textSecondary}
                />
              }
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <Button
              title="Alterar senha"
              onPress={handleResetPassword}
              loading={isLoading}
              disabled={isLoading}
            />
          </>
        );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <IconSymbol
              name="chevron.right"
              size={24}
              color={colors.text}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.logo, { color: colors.text }]}>PoupaDin</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {renderStepContent()}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logo: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  form: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.lineHeight.lg,
    marginBottom: Spacing.xl,
  },
  codeContainer: {
    marginVertical: Spacing.xl,
  },
  resendButton: {
    alignSelf: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  resendText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
});