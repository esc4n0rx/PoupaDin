import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserAPI } from '@/services/api/user';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../ui/Button';
import { IconSymbol } from '../ui/icon-symbol';
import { Input } from '../ui/Input';
import { Toast } from '../ui/Toast';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ visible, onClose }: DeleteAccountModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setStep('warning');
    setErrors({});
    onClose();
  };

  const handleContinue = () => {
    setStep('confirm');
  };

  const validateFields = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (email.trim().toLowerCase() !== user?.email.toLowerCase()) {
      newErrors.email = 'Email não corresponde ao da conta';
    }

    if (!password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDeleteAccount = async () => {
    if (!validateFields()) {
      setToast({
        visible: true,
        message: 'Preencha todos os campos corretamente',
        type: 'error',
      });
      return;
    }

    Alert.alert(
      'Última confirmação',
      'Tem ABSOLUTA CERTEZA que deseja apagar sua conta? Esta ação é IRREVERSÍVEL e todos os seus dados serão PERMANENTEMENTE deletados.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'SIM, APAGAR TUDO',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const response = await UserAPI.deleteAccount(email, password);

              if (response.success) {
                // Fazer logout
                await logout();
                // Ir para tela de boas-vindas
                router.replace('/welcome');
              } else {
                setToast({
                  visible: true,
                  message: response.error || 'Erro ao apagar conta',
                  type: 'error',
                });
              }
            } catch (error) {
              console.error('Delete account error:', error);
              setToast({
                visible: true,
                message: 'Erro ao apagar conta. Tente novamente.',
                type: 'error',
              });
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <IconSymbol
              name="chevron.right"
              size={24}
              color={colors.text}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Resetar e Apagar
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {step === 'warning' ? (
            <>
              <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
                <IconSymbol name="trash.fill" size={64} color={colors.error} />
              </View>

              <Text style={[styles.title, { color: colors.error }]}>
                ATENÇÃO: Ação Irreversível
              </Text>

              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Você está prestes a apagar permanentemente sua conta e TODOS os seus
                dados do PoupaDin.
              </Text>

              <View style={styles.warningList}>
                <WarningItem
                  icon="xmark.circle.fill"
                  text="Todas as suas categorias serão apagadas"
                  colors={colors}
                />
                <WarningItem
                  icon="xmark.circle.fill"
                  text="Todas as suas metas serão perdidas"
                  colors={colors}
                />
                <WarningItem
                  icon="xmark.circle.fill"
                  text="Todas as suas transações serão deletadas"
                  colors={colors}
                />
                <WarningItem
                  icon="xmark.circle.fill"
                  text="Seu perfil será completamente removido"
                  colors={colors}
                />
                <WarningItem
                  icon="xmark.circle.fill"
                  text="Esta ação NÃO PODE ser desfeita"
                  colors={colors}
                />
              </View>

              <View
                style={[
                  styles.dangerBox,
                  { backgroundColor: colors.error + '20', borderColor: colors.error },
                ]}>
                <IconSymbol
                  name="exclamationmark.triangle.fill"
                  size={24}
                  color={colors.error}
                />
                <Text style={[styles.dangerText, { color: colors.error }]}>
                  Recomendamos fazer um backup dos seus dados antes de continuar.
                  Use a opção "Exportar Registros" no menu.
                </Text>
              </View>

              <Button
                title="Entendo, quero continuar"
                onPress={handleContinue}
                variant="outline"
                style={{ borderColor: colors.error }}
                textStyle={{ color: colors.error }}
              />
              <Button
                title="Cancelar"
                onPress={handleClose}
                variant="outline"
              />
            </>
          ) : (
            <>
              <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
                <IconSymbol name="lock.shield.fill" size={64} color={colors.error} />
              </View>

              <Text style={[styles.title, { color: colors.text }]}>
                Confirme sua identidade
              </Text>

              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Para sua segurança, confirme seu email e senha para apagar a conta.
              </Text>

              <View style={styles.form}>
                <Input
                  label="Email *"
                  placeholder="Digite seu email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: '' }));
                    }
                  }}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Input
                  label="Senha *"
                  placeholder="Digite sua senha"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: '' }));
                    }
                  }}
                  error={errors.password}
                  secureTextEntry
                />
              </View>

              <View
                style={[
                  styles.dangerBox,
                  { backgroundColor: colors.error + '20', borderColor: colors.error },
                ]}>
                <Text style={[styles.dangerText, { color: colors.error }]}>
                  Ao clicar em "APAGAR MINHA CONTA", você confirma que entende que
                  esta ação é permanente e todos os seus dados serão deletados.
                </Text>
              </View>

              <Button
                title="APAGAR MINHA CONTA"
                onPress={handleDeleteAccount}
                loading={isDeleting}
                disabled={isDeleting}
                style={{ backgroundColor: colors.error }}
              />
              <Button
                title="Voltar"
                onPress={() => setStep('warning')}
                variant="outline"
                disabled={isDeleting}
              />
            </>
          )}
        </ScrollView>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
      </View>
    </Modal>
  );
}

function WarningItem({
  icon,
  text,
  colors,
}: {
  icon: any;
  text: string;
  colors: any;
}) {
  return (
    <View style={styles.warningItem}>
      <IconSymbol name={icon} size={20} color={colors.error} />
      <Text style={[styles.warningItemText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: Spacing.base,
    paddingTop: Spacing['2xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeight.lg,
  },
  warningList: {
    marginBottom: Spacing.xl,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  warningItemText: {
    fontSize: Typography.fontSize.base,
    flex: 1,
  },
  dangerBox: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    borderWidth: 2,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  dangerText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.md,
    fontWeight: Typography.fontWeight.semiBold,
  },
  form: {
    marginBottom: Spacing.xl,
    gap: Spacing.base,
  },
});
