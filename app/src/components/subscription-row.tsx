import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Subscription } from '@/lib/types';
import { daysUntil, formatCurrency, formatDate } from '@/lib/format';

export function SubscriptionRow({
  sub,
  onDelete,
}: {
  sub: Subscription;
  onDelete?: (id: string) => void;
}) {
  const days = daysUntil(sub.nextRenewal);
  const isTrial = sub.status === 'trial';

  return (
    <View style={styles.row}>
      <View style={[styles.dot, isTrial && styles.dotTrial]} />
      <View style={styles.body}>
        <Text style={styles.name}>{sub.name}</Text>
        <Text style={styles.meta}>
          {sub.category} · {sub.cycle}
          {isTrial && days > 0 ? ` · ${days}d trial left` : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>
          {formatCurrency(sub.price, sub.currency)}
        </Text>
        <Text style={styles.renewal}>renews {formatDate(sub.nextRenewal)}</Text>
        {onDelete ? (
          <Pressable hitSlop={8} onPress={() => onDelete(sub.id)}>
            <Text style={styles.delete}>Delete</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  dotTrial: {
    backgroundColor: Colors.warning,
  },
  body: { flex: 1 },
  name: {
    color: Colors.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    color: Colors.inkSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  right: { alignItems: 'flex-end' },
  price: {
    color: Colors.ink,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  renewal: {
    color: Colors.inkMuted,
    fontSize: 12,
    marginTop: 2,
  },
  delete: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 6,
  },
});
