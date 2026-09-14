import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Detection } from '@/lib/types';

export function DetectionRow({
  det,
  onConfirm,
  onIgnore,
}: {
  det: Detection;
  onConfirm: () => void;
  onIgnore: () => void;
}) {
  const from = (det.from ?? '').replace(/<[^>]+>/, '').trim();

  return (
    <View style={styles.card}>
      <View style={styles.body}>
        <Text style={styles.from}>{from || 'Unknown sender'}</Text>
        <Text style={styles.subject} numberOfLines={2}>
          {det.subject || '(no subject)'}
        </Text>
        {det.snippet ? (
          <Text style={styles.snippet} numberOfLines={2}>
            {det.snippet}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onConfirm}
          style={[styles.btn, styles.confirm]}
          hitSlop={6}
        >
          <Text style={styles.confirmText}>✓</Text>
        </Pressable>
        <Pressable
          onPress={onIgnore}
          style={[styles.btn, styles.ignore]}
          hitSlop={6}
        >
          <Text style={styles.ignoreText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  body: { flex: 1 },
  from: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  subject: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 3,
  },
  snippet: {
    color: Colors.inkSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  actions: {
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  confirm: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.borderGlow,
  },
  confirmText: { color: Colors.accent, fontSize: 20, fontWeight: '700' },
  ignore: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderColor: 'rgba(248,113,113,0.35)',
  },
  ignoreText: { color: Colors.danger, fontSize: 18, fontWeight: '700' },
});
