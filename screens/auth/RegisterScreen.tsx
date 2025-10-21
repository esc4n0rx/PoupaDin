import { router } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { DateInput } from '../../components/ui/DateInput';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '../../theme';
import { Validation } from '../../utils/validation';

export default function RegisterScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birth_date: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const updateField = useCallback((field: string, value: any) => {
       setFormData((prev) => ({ ...prev, [field]: value }));
       if (errors[field]) {
         setErrors((prev) => {
           const newErrors = { ...prev };
           delete newErrors[field];
           return newErrors;
         });
       }
     }, [errors]);

     
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name) {
      newErrors.full_name = 'Nome completo é obrigatório';
    } else if (!Validation.fullName(formData.full_name)) {
      newErrors.full_name = 'Digite seu nome completo';
    }

    if (!formData.email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!Validation.email(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.birth_date) {
      newErrors.birth_date = 'Data de nascimento é obrigatória';
    } else {
      const birthValidation = Validation.birthDate(formData.birth_date);
      if (!birthValidation.valid) {
        newErrors.birth_date = birthValidation.message || 'Data inválida';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else {
      const passwordValidation = Validation.password(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message || 'Senha inválida';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        birth_date: formData.birth_date,
      });

      if (result.success) {
        setToast({
          visible: true,
          message: 'Conta criada com sucesso! Faça login para continuar.',
          type: 'success',
        });
        
        // Aguardar 2 segundos e redirecionar para login
        setTimeout(() => {
          router.replace('/auth/login');
        }, 2000);
      } else {
        setToast({
          visible: true,
          message: result.error || 'Erro ao criar conta',
          type: 'error',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Erro ao criar conta. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.back();
  };

  // Definir data mínima (13 anos atrás) e máxima (hoje)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.logo, { color: colors.text }]}>PoupaDin</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Crie sua conta gratuitamente
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={[styles.title, { color: colors.text }]}>
              Cadastre-se
            </Text>

            <Input
              label="Nome completo"
              placeholder="João Silva"
              value={formData.full_name}
              onChangeText={(text) => updateField('full_name', text)}
              error={errors.full_name}
              autoCapitalize="words"
            />

            <Input
              label="E-mail"
              placeholder="exemplo@email.com"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <DateInput
              label="Data de nascimento"
              placeholder="Selecione sua data de nascimento"
              value={formData.birth_date}
              onChange={(date) => updateField('birth_date', date)}
              error={errors.birth_date}
              minimumDate={minDate}
              maximumDate={maxDate}
            />

            <Input
              label="Senha"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              error={errors.password}
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
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
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
              title="Registrar"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textTertiary }]}>ou</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                Já tem uma conta?{' '}
              </Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={[styles.loginLink, { color: colors.primary }]}>
                  Fazer login
                </Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
  },
  form: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: Typography.fontSize.sm,
  },
  loginLink: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
});