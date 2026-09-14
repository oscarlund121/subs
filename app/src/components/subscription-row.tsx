import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, pressed, Spacing, Type } from '@/constants/theme';
import { Subscription } from '@/lib/types';
import { daysUntil, formatCurrency, formatCycle, formatRelativeDay } from '@/lib/format';
import { Avatar } from './avatar';
import { Chip } from './chip';

/** Inside this window the renewal is worth calling out rather than stating. */
const SOON_DAYS = 3;

/**
 * One line of a grouped list. The row carries no surface of its own — the
 * parent <Card> provides it — so rows stack into a single continuous panel.
 */
export function SubscriptionRow({
  sub,
  onPress,
}: {
  sub: Subscription;
  onPress?: (sub: Subscription) => void;
}) {
  const days = daysUntil(sub.nextRenewal);
  const isTrial = sub.status === 'trial';
  const soon = days >= 0 && days <= SOON_DAYS;

  const body = (
    <View style={styles.row}>
      <Avatar name={sub.name} />

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {sub.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {sub.category}
          </Text>
          {isTrial ? (
            <Chip tone="warning" label={days > 0 ? `${days}d trial` : 'Trial'} />
          ) : null}
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.price}>
          {formatCurrency(sub.price, sub.currency)}
          <Text style={styles.cycle}>{formatCycle(sub.cycle)}</Text>
        </Text>
        <Text style={[styles.renewal, soon && styles.renewalSoon]}>
          {formatRelativeDay(sub.nextRenewal)}
        </Text>
      </View>

      {onPress ? (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={Colors.inkMuted}
          style={styles.chevron}
        />
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={() => onPress(sub)} style={pressed}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  body: { flex: 1, gap: 3 },
  name: { ...Type.body, color: Colors.ink, fontWeight: '600' },
  // Wraps rather than squeezing the category into an ellipsis when a chip
  // shares the line.
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    rowGap: Spacing.xs,
  },
  meta: { ...Type.meta, color: Colors.inkMuted },
  right: { alignItems: 'flex-end', gap: 3 },
  price: { ...Type.body, color: Colors.ink, fontWeight: '600' },
  cycle: { ...Type.small, color: Colors.inkMuted, fontWeight: '500' },
  renewal: { ...Type.small, color: Colors.inkMuted, fontWeight: '500' },
  renewalSoon: { color: Colors.warning, fontWeight: '600' },
  chevron: { marginLeft: -Spacing.xs, marginRight: -Spacing.sm },
});
