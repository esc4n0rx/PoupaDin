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
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { AuthAPI } from '../../services/api/auth';
import { BorderRadius, Colors, Spacing, Typography } from '../../theme';
import { Validation } from '../../utils/validation';

export default function RecoveryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const validate = (): boolean => {
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!Validation.email(email)) {
      newErrors.email = 'E-mail inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestRecovery = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await AuthAPI.requestRecovery({ email });

      if (result.success) {
        setEmailSent(true);
        setToast({
          visible: true,
          message: 'E-mail de recuperação enviado com sucesso!',
          type: 'success',
        });
      } else {
        setToast({
          visible: true,
          message: result.error || 'Erro ao enviar e-mail',
          type: 'error',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Erro ao enviar e-mail. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    handleRequestRecovery();
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
          {/* Header com botão voltar */}
          <TouchableOpacity
            onPress={handleBackToLogin}
            style={styles.backButton}
            activeOpacity={0.7}>
            <IconSymbol name="chevron.right" size={24} color={colors.text} />
          </TouchableOpacity>

          {!emailSent ? (
            // Formulário de solicitação
            <>
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <IconSymbol name="paperplane.fill" size={48} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                  Recuperar Senha
                </Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  Digite seu e-mail e enviaremos um link para você redefinir sua senha
                </Text>
              </View>

              <View style={styles.form}>
                <Input
                  label="E-mail"
                  placeholder="seu@email.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors({});
                  }}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  leftIcon={
                    <IconSymbol name="paperplane.fill" size={20} color={colors.textSecondary} />
                  }
                />

                <Button
                  title="Enviar Link de Recuperação"
                  onPress={handleRequestRecovery}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.submitButton}
                />

                <TouchableOpacity
                  onPress={handleBackToLogin}
                  style={styles.backToLoginButton}
                  activeOpacity={0.7}>
                  <Text style={[styles.backToLoginText, { color: colors.textSecondary }]}>
                    Lembrou sua senha?{' '}
                    <Text style={{ color: colors.primary, fontWeight: Typography.fontWeight.semiBold }}>
                      Fazer login
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Confirmação de envio
            <>
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
                  <IconSymbol name="checkmark.circle.fill" size={48} color={colors.success} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                  E-mail Enviado!
                </Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  Enviamos um link de recuperação para:
                </Text>
                <Text style={[styles.emailText, { color: colors.primary }]}>
                  {email}
                </Text>
              </View>

              <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <View style={styles.infoItem}>
                  <IconSymbol name="clock.fill" size={20} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    O link expira em 1 hora
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <IconSymbol name="paperplane.fill" size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Verifique sua caixa de entrada e spam
                </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                      <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Clique no link para redefinir sua senha
                      </Text>
                    </View>
                  </View>          
          <View style={styles.actions}>
            <Button
              title="Voltar para Login"
              onPress={handleBackToLogin}
              variant="primary"
              style={styles.actionButton}
            />            <TouchableOpacity
              onPress={handleResendEmail}
              style={styles.resendButton}
              disabled={isLoading}
              activeOpacity={0.7}>
              <Text style={[styles.resendText, { color: colors.primary }]}>
                Não recebeu o e-mail? Reenviar
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
}const styles = StyleSheet.create({
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
backButton: {
width: 40,
height: 40,
justifyContent: 'center',
alignItems: 'flex-start',
marginBottom: Spacing.lg,
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
emailText: {
fontSize: Typography.fontSize.lg,
fontWeight: Typography.fontWeight.semiBold,
marginTop: Spacing.sm,
textAlign: 'center',
},
form: {
gap: Spacing.base,
},
submitButton: {
marginTop: Spacing.lg,
},
backToLoginButton: {
marginTop: Spacing.lg,
alignItems: 'center',
},
backToLoginText: {
fontSize: Typography.fontSize.base,
},
infoBox: {
padding: Spacing.base,
borderRadius: BorderRadius.base,
borderWidth: 1,
marginBottom: Spacing.xl,
gap: Spacing.md,
},
infoItem: {
flexDirection: 'row',
alignItems: 'center',
gap: Spacing.sm,
},
infoText: {
fontSize: Typography.fontSize.sm,
flex: 1,
lineHeight: Typography.lineHeight.base,
},
actions: {
gap: Spacing.base,
},
actionButton: {
marginBottom: Spacing.sm,
},
resendButton: {
padding: Spacing.md,
alignItems: 'center',
},
resendText: {
fontSize: Typography.fontSize.base,
fontWeight: Typography.fontWeight.semiBold,
},
});