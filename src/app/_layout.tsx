import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Hydration-safe on web: renders "light" on the server and first client pass, like the HTML.
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        {/* No swipe-back to the login form once the user is verified. */}
        <Stack.Screen name="success" options={{ gestureEnabled: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
