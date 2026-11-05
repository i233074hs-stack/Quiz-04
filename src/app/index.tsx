import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { useRecaptchaVerifier } from '@/components/recaptcha-verifier';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  authErrorMessage,
  confirmOtp,
  sendOtp,
  subscribeToAuth,
  type ConfirmationResult,
} from '@/lib/firebase-auth';
import { isValidPhone, normalizePhone, OTP_LENGTH } from '@/lib/phone';

const RESEND_SECONDS = 60;

type Message = { kind: 'error' | 'info'; text: string } | null;

export default function LoginScreen() {
  const theme = useTheme();
  const { getVerifier, recaptcha } = useRecaptchaVerifier();
  const [phone, setPhone] = useState('+92');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [cooldown, setCooldown] = useState(0);

  const normalizedPhone = normalizePhone(phone);
  const step = confirmation ? 'otp' : 'phone';

  // Any signed-in user goes to the success page: after a correct OTP, or a
  // session saved from an earlier launch.
  useEffect(
    () =>
      subscribeToAuth((user) => {
        if (user) router.replace('/success');
      }),
    []
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSendOtp() {
    if (!isValidPhone(normalizedPhone)) {
      setMessage({
        kind: 'error',
        text: 'Enter your number with the country code, e.g. +923001234567.',
      });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      setConfirmation(await sendOtp(normalizedPhone, getVerifier()));
      setCode('');
      setCooldown(RESEND_SECONDS);
      setMessage({ kind: 'info', text: `We sent a ${OTP_LENGTH}-digit code to ${normalizedPhone}.` });
    } catch (error) {
      setMessage({ kind: 'error', text: authErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!confirmation) return;
    if (code.length !== OTP_LENGTH) {
      setMessage({ kind: 'error', text: `The OTP must be ${OTP_LENGTH} digits.` });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await confirmOtp(confirmation, code);
      // Navigation happens in the auth listener above.
    } catch (error) {
      setMessage({ kind: 'error', text: `Verification failed. ${authErrorMessage(error)}` });
      setLoading(false);
    }
  }

  function handleChangeNumber() {
    setConfirmation(null);
    setCode('');
    setCooldown(0);
    setMessage(null);
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text },
  ];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemedText type="subtitle">{step === 'phone' ? 'Login' : 'Enter OTP'}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {step === 'phone'
                ? "Enter your phone number and we'll text you a one-time password."
                : `Type the ${OTP_LENGTH}-digit code sent to ${normalizedPhone}.`}
            </ThemedText>
          </View>

          {step === 'phone' ? (
            <View style={styles.field}>
              <ThemedText type="smallBold">Phone number</ThemedText>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+923001234567"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                editable={!loading}
                returnKeyType="send"
                onSubmitEditing={handleSendOtp}
                style={inputStyle}
              />
            </View>
          ) : (
            <View style={styles.field}>
              <ThemedText type="smallBold">One-time password</ThemedText>
              <TextInput
                value={code}
                onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                placeholder={'•'.repeat(OTP_LENGTH)}
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                maxLength={OTP_LENGTH}
                editable={!loading}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleVerify}
                style={[inputStyle, styles.otpInput]}
              />
            </View>
          )}

          {message && (
            <View
              accessibilityLiveRegion="polite"
              style={[
                styles.message,
                { borderColor: message.kind === 'error' ? Palette.danger : Palette.primary },
              ]}>
              <ThemedText
                type="small"
                style={{ color: message.kind === 'error' ? Palette.danger : Palette.primary }}>
                {message.text}
              </ThemedText>
            </View>
          )}

          {step === 'phone' ? (
            <PrimaryButton title="Send OTP" onPress={handleSendOtp} loading={loading} />
          ) : (
            <View style={styles.actions}>
              <PrimaryButton
                title="Verify OTP"
                onPress={handleVerify}
                loading={loading}
                disabled={code.length !== OTP_LENGTH}
              />
              <PrimaryButton
                variant="text"
                title={cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                onPress={handleSendOtp}
                disabled={cooldown > 0 || loading}
              />
              <PrimaryButton
                variant="text"
                title="Change phone number"
                onPress={handleChangeNumber}
                disabled={loading}
              />
            </View>
          )}
          {recaptcha}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  header: { gap: Spacing.two },
  field: { gap: Spacing.two },
  input: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    fontSize: 18,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 26,
    letterSpacing: 12,
    fontWeight: 600,
  },
  message: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
  },
  actions: { gap: Spacing.one },
});
