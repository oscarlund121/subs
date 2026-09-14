import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { Subscription } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { StatTile } from '@/components/stat-tile';
import { SubscriptionRow } from '@/components/subscription-row';

function monthlyEquivalent(price: number, cycle: string): number {
  switch (cycle) {
    case 'weekly':
      return price * 4.33;
    case 'quarterly':
      return price / 3;
    case 'yearly':
      return price / 12;
    default:
      return price;
  }
}

export default function HomeScreen() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setSubs(await api.listSubscriptions());
    } catch {
      /* backend unreachable — leave empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const monthlyTotal = subs.reduce(
    (sum, s) => sum + monthlyEquivalent(s.price, s.cycle),
    0,
  );
  const activeCount = subs.filter((s) => s.status !== 'cancelled').length;
  const trialCount = subs.filter((s) => s.status === 'trial').length;
  const upcoming = subs
    .filter((s) => s.status !== 'cancelled')
    .sort(
      (a, b) =>
        new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime(),
    )
    .slice(0, 3);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ActivityIndicator color={Colors.accent} style={styles.loading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>Subs</Text>
        <Text style={styles.subheading}>Your subscriptions at a glance</Text>

        <View style={styles.statsRow}>
          <StatTile
            label="Monthly spend"
            value={formatCurrency(monthlyTotal)}
            accent
          />
          <StatTile label="Active" value={String(activeCount)} />
          <StatTile label="Trials" value={String(trialCount)} />
        </View>

        <Text style={styles.sectionTitle}>Upcoming renewals</Text>
        {upcoming.length ? (
          <View style={styles.list}>
            {upcoming.map((s) => (
              <SubscriptionRow key={s.id} sub={s} />
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>
            No subscriptions yet — add one from the Subscriptions tab.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, gap: Spacing.md },
  loading: { marginTop: Spacing.xl },
  brand: {
    color: Colors.ink,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subheading: { color: Colors.inkSecondary, fontSize: 14, marginTop: -Spacing.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  sectionTitle: {
    color: Colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  list: { gap: Spacing.sm },
  empty: { color: Colors.inkMuted, fontSize: 14 },
});
