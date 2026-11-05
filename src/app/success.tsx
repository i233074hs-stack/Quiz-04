import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authErrorMessage, currentUser, logout, subscribeToAuth } from '@/lib/firebase-auth';

export default function SuccessScreen() {
  const theme = useTheme();
  const [user, setUser] = useState(currentUser());
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Back to login whenever the session ends (logout, or opened here without signing in).
  useEffect(
    () =>
      subscribeToAuth((next) => {
        setUser(next);
        if (!next) router.replace('/');
      }),
    []
  );

  async function handleLogout() {
    setLoggingOut(true);
    setError(null);
    try {
      await logout();
    } catch (e) {
      setError(authErrorMessage(e));
      setLoggingOut(false);
    }
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <View style={[styles.badge, { backgroundColor: Palette.success }]}>
          <Text style={styles.check}>✓</Text>
        </View>

        <View style={styles.text}>
          <ThemedText type="subtitle" style={styles.center}>
            Login Successful
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Your phone number has been verified with Firebase.
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Phone number
          </ThemedText>
          <ThemedText type="smallBold">{user?.phoneNumber ?? '—'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.spaced}>
            User ID
          </ThemedText>
          <ThemedText type="code" selectable>
            {user?.uid ?? '—'}
          </ThemedText>
        </View>

        {error && (
          <ThemedText type="small" style={{ color: Palette.danger }}>
            {error}
          </ThemedText>
        )}

        <View style={styles.button}>
          <PrimaryButton title="Logout" onPress={handleLogout} loading={loggingOut} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#fff', fontSize: 52, fontWeight: 700, lineHeight: 60 },
  text: { gap: Spacing.two },
  center: { textAlign: 'center' },
  card: {
    alignSelf: 'stretch',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  spaced: { marginTop: Spacing.two },
  button: { alignSelf: 'stretch' },
});
