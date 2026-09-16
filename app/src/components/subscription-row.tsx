import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, pressed, Spacing, Type } from '@/constants/theme';
import { Subscription } from '@/lib/types';
import {
  daysUntil,
  formatCurrency,
  formatCycle,
  formatRelativeDay,
} from '@/lib/format';
import { CategoryIcon } from './category-icon';
import { Chip } from './chip';

/** Inside this window the renewal is worth calling out rather than stating. */
const SOON_DAYS = 3;

/**
 * One line of a grouped list, in the kit's shape: category disc, name over a
 * secondary line, then a vertical rule separating the amount. The row carries
 * no surface of its own — the parent <Card> provides it.
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
      <CategoryIcon category={sub.category} />

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {sub.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.category} numberOfLines={1}>
            {sub.category}
          </Text>
          {isTrial ? (
            <Chip
              tone="warning"
              label={days > 0 ? `${days}d trial` : 'Trial'}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.rule} />

      <View style={styles.right}>
        <Text style={styles.price} numberOfLines={1}>
          {formatCurrency(sub.price, sub.currency)}
          <Text style={styles.cycle}>{formatCycle(sub.cycle)}</Text>
        </Text>
        <Text
          style={[styles.renewal, soon && styles.renewalSoon]}
          numberOfLines={1}
        >
          {formatRelativeDay(sub.nextRenewal)}
        </Text>
      </View>
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
  name: { ...Type.body, fontFamily: Fonts.semibold, color: Colors.ink },
  // Wraps rather than squeezing the date into an ellipsis when a chip shares
  // the line.
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    rowGap: Spacing.xs,
  },
  category: { ...Type.meta, fontSize: 13, color: Colors.inkMuted },
  renewal: { ...Type.meta, fontSize: 12.5, color: Colors.accentInk },
  renewalSoon: { color: Colors.warning, fontFamily: Fonts.subMedium },

  /** The kit's vertical hairline between the row body and its amount. */
  rule: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 2,
    backgroundColor: Colors.separator,
  },

  right: { alignItems: 'flex-end', gap: 3, minWidth: 86 },
  price: { ...Type.amount, color: Colors.ink },
  cycle: { ...Type.small, fontSize: 12, color: Colors.inkMuted },
});
