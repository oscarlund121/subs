import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Spacing, Type } from '@/constants/theme';
import { Detection } from '@/lib/types';
import {
  daysUntil,
  formatCurrency,
  formatCycle,
  formatRelativeDay,
} from '@/lib/format';
import { CategoryIcon } from './category-icon';
import { Button } from './button';
import { Card } from './card';
import { Chip } from './chip';

/** Below this the parser is guessing enough that the user should look. */
const NEEDS_REVIEW_BELOW = 0.75;

export function DetectionRow({
  det,
  onConfirm,
  onReview,
  onIgnore,
}: {
  det: Detection;
  onConfirm: () => void;
  onReview: () => void;
  onIgnore: () => void;
}) {
  const sender = (det.from ?? '')
    .replace(/<[^>]+>/, '')
    .replace(/"/g, '')
    .trim();
  const needsReview =
    det.confidence !== null && det.confidence < NEEDS_REVIEW_BELOW;
  const isTrial = Boolean(det.trialEndsAt);
  const trialDays = isTrial ? daysUntil(det.trialEndsAt) : 0;
  const missingPrice = det.price === null;
  const service = det.service ?? 'Unknown service';

  // "Disney Plus / Disney+" tells the user nothing twice, so the sender only
  // earns its place when it names something other than the service itself.
  const senderIsRedundant =
    !sender ||
    sender.toLowerCase().includes(service.toLowerCase().split(' ')[0]) ||
    service.toLowerCase().includes(sender.toLowerCase());
  const meta = [det.category ?? 'Other', senderIsRedundant ? null : sender]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <CategoryIcon category={det.category} />
        <View style={styles.headerText}>
          <Text style={styles.service} numberOfLines={1}>
            {service}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
        <View style={styles.priceBlock}>
          {missingPrice ? (
            <Text style={styles.noPrice}>No price</Text>
          ) : (
            <Text style={styles.price}>
              {formatCurrency(det.price!, det.currency ?? 'DKK')}
              <Text style={styles.cycle}>{formatCycle(det.cycle)}</Text>
            </Text>
          )}
          <Text style={styles.renewal}>
            {isTrial && trialDays > 0
              ? `Trial ends ${formatRelativeDay(det.trialEndsAt)}`
              : `Renews ${formatRelativeDay(det.renewalAt)}`}
          </Text>
        </View>
      </View>

      {isTrial || needsReview || missingPrice ? (
        <View style={styles.chips}>
          {isTrial ? (
            <Chip
              tone="warning"
              label={
                trialDays > 0 ? `${trialDays} days of trial left` : 'Free trial'
              }
            />
          ) : null}
          {needsReview || missingPrice ? (
            <Chip tone="neutral" label="Worth a check" />
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Not for me"
          size="sm"
          variant="quiet"
          onPress={onIgnore}
          style={styles.action}
        />
        <Button
          label="Edit"
          size="sm"
          variant="quiet"
          onPress={onReview}
          style={styles.action}
        />
        <Button
          label="Add"
          size="sm"
          variant="primary"
          onPress={onConfirm}
          style={styles.action}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.lg, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerText: { flex: 1, gap: 3 },
  service: { ...Type.body, fontFamily: Fonts.semibold, color: Colors.ink },
  meta: { ...Type.meta, color: Colors.inkMuted },
  priceBlock: { alignItems: 'flex-end', gap: 3 },
  price: { ...Type.amount, color: Colors.ink },
  cycle: { ...Type.small, color: Colors.inkMuted },
  noPrice: { ...Type.meta, color: Colors.inkMuted },
  renewal: { ...Type.small, color: Colors.inkMuted },
  chips: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  action: { flex: 1 },
});
