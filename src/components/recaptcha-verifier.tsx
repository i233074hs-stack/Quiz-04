/**
 * reCAPTCHA for Firebase phone auth on Android / iOS (web version: recaptcha-verifier.web.tsx).
 *
 * The Firebase JS SDK needs a reCAPTCHA token before it will send an SMS, but reCAPTCHA only
 * runs in a browser. This shows the "I'm not a robot" check in a WebView served from the
 * project's authDomain (an authorized domain), and hands the token back to the SDK.
 */
import { SDK_VERSION } from 'firebase/app';
import type { ApplicationVerifier } from 'firebase/auth';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { firebaseConfig } from '@/config/firebase-config';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

type Pending = { resolve: (token: string) => void; reject: (error: Error) => void };

type RecaptchaMessage =
  | { type: 'token'; token: string }
  | { type: 'expired' }
  | { type: 'error'; message: string };

function recaptchaHtml(theme: 'light' | 'dark') {
  const cdn = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { margin: 0; height: 100%; background: transparent; }
    body { display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body>
  <div id="recaptcha-container"></div>
  <script type="module">
    import { initializeApp } from '${cdn}/firebase-app.js';
    import { getAuth, RecaptchaVerifier } from '${cdn}/firebase-auth.js';

    const send = (msg) => window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    try {
      const auth = getAuth(initializeApp(${JSON.stringify(firebaseConfig)}));
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        theme: '${theme}',
        callback: (token) => send({ type: 'token', token }),
        'expired-callback': () => send({ type: 'expired' }),
      });
      verifier.render().catch((e) => send({ type: 'error', message: String(e && e.message || e) }));
    } catch (e) {
      send({ type: 'error', message: String(e && e.message || e) });
    }
  </script>
</body>
</html>`;
}

function cancelledError() {
  return Object.assign(new Error('reCAPTCHA was cancelled.'), { code: 'recaptcha/cancelled' });
}

export function useRecaptchaVerifier(): {
  getVerifier: () => ApplicationVerifier;
  recaptcha: ReactNode;
} {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [visible, setVisible] = useState(false);
  const pending = useRef<Pending | null>(null);

  function settle(result: { token: string } | { error: Error }) {
    const current = pending.current;
    pending.current = null;
    setVisible(false);
    if (!current) return;
    if ('token' in result) current.resolve(result.token);
    else current.reject(result.error);
  }

  // Shape the SDK expects from an ApplicationVerifier (type "recaptcha" + verify + _reset).
  const verifier = useMemo<ApplicationVerifier & { _reset(): void }>(
    () => ({
      type: 'recaptcha',
      verify: () =>
        new Promise<string>((resolve, reject) => {
          pending.current?.reject(cancelledError());
          pending.current = { resolve, reject };
          setVisible(true);
        }),
      _reset: () => {},
    }),
    []
  );

  function handleMessage(event: WebViewMessageEvent) {
    let message: RecaptchaMessage;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (message.type === 'token') settle({ token: message.token });
    else if (message.type === 'error') settle({ error: new Error(`reCAPTCHA error: ${message.message}`) });
    // "expired": the widget resets itself, so the user can simply tick it again.
  }

  const recaptcha = (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => settle({ error: cancelledError() })}>
      <SafeAreaView style={[styles.sheet, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <ThemedText type="smallBold">Verify you&apos;re not a robot</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Firebase needs this check before it sends the OTP.
          </ThemedText>
        </View>
        {visible && (
          <WebView
            source={{ html: recaptchaHtml(scheme), baseUrl: `https://${firebaseConfig.authDomain}` }}
            originWhitelist={['*']}
            onMessage={handleMessage}
            javaScriptEnabled
            style={styles.webview}
          />
        )}
        <PrimaryButton
          variant="text"
          title="Cancel"
          onPress={() => settle({ error: cancelledError() })}
        />
      </SafeAreaView>
    </Modal>
  );

  return { getVerifier: () => verifier, recaptcha };
}

const styles = StyleSheet.create({
  sheet: { flex: 1, padding: Spacing.three, gap: Spacing.three },
  header: { gap: Spacing.one, paddingTop: Spacing.two },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
