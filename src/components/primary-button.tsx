import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'text';
};

export function PrimaryButton({ title, onPress, loading, disabled, variant = 'solid' }: Props) {
  const theme = useTheme();
  const inactive = disabled || loading;
  const solid = variant === 'solid';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        solid && { backgroundColor: Palette.primary },
        inactive && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
      ]}>
      {loading ? (
        <ActivityIndicator color={solid ? '#fff' : Palette.primary} />
      ) : (
        <Text style={[styles.label, { color: solid ? '#fff' : theme.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  label: {
    fontSize: 16,
    fontWeight: 600,
  },
});
