import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, pressed, Radius, Spacing, Type } from '@/constants/theme';

/**
 * Surfaces a failed request. Screens used to swallow these, which made an
 * unreachable backend look like an empty account.
 */
export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={8} style={(s) => [styles.retry, pressed(s)]}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.dangerSoft,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  text: { ...Type.meta, color: Colors.danger, flex: 1, lineHeight: 19 },
  retry: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(176,74,58,0.12)',
  },
  retryText: { ...Type.small, color: Colors.danger },
});
