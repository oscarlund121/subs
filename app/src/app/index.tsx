import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { api } from '@/lib/api';
import { Subscription } from '@/lib/types';
import { formatCurrency, monthlyTotals, primaryCurrency } from '@/lib/format';
import { Card, Separator } from '@/components/card';
import { StatTile } from '@/components/stat-tile';
import { SubscriptionRow } from '@/components/subscription-row';
import { ErrorBanner } from '@/components/error-banner';

/** How many renewals are worth previewing before it becomes a list. */
const UPCOMING_COUNT = 4;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSubs(await api.listSubscriptions());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load subscriptions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totals = monthlyTotals(subs);
  const main = primaryCurrency(totals);
  // Currencies are reported separately — we have no exchange rates, and a
  // single blended number would misstate the spend.
  const others = Object.entries(totals).filter(([code]) => code !== main);

  const activeCount = subs.filter((s) => s.status !== 'cancelled').length;
  const trialCount = subs.filter((s) => s.status === 'trial').length;
  const upcoming = subs
    .filter((s) => s.status !== 'cancelled')
    .sort(
      (a, b) =>
        new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime(),
    )
    .slice(0, UPCOMING_COUNT);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ActivityIndicator color={Colors.accent} style={styles.loading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={Colors.inkMuted}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.headline}>Here's your month</Text>
        </View>

        {error ? <ErrorBanner message={error} onRetry={load} /> : null}

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Monthly spend</Text>
          <Text style={styles.heroValue}>
            {main ? formatCurrency(totals[main], main) : '—'}
          </Text>
          {others.length ? (
            <Text style={styles.heroAside}>
              plus{' '}
              {others
                .map(([code, amount]) => formatCurrency(amount, code))
                .join(' and ')}{' '}
              a month
            </Text>
          ) : null}

          <View style={styles.heroDivider} />

          <View style={styles.heroStats}>
            <StatTile label="Active" value={String(activeCount)} />
            <StatTile label="On trial" value={String(trialCount)} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Coming up</Text>
        {upcoming.length ? (
          <Card>
            {upcoming.map((s, i) => (
              <View key={s.id}>
                {i > 0 ? <Separator inset={70} /> : null}
                <SubscriptionRow
                  sub={s}
                  onPress={() => router.push('/subscriptions')}
                />
              </View>
            ))}
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.empty}>
              {error
                ? 'Nothing to show while the server is unreachable.'
                : 'Nothing tracked yet. Check the Inbox tab for subscriptions found in your email, or add one by hand.'}
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  loading: { marginTop: Spacing.xxl },
  header: { paddingTop: Spacing.sm, gap: 2 },
  greeting: { ...Type.meta, color: Colors.inkMuted },
  headline: { ...Type.title, color: Colors.ink },

  hero: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
  },
  heroLabel: { ...Type.meta, color: Colors.accentInk, fontWeight: '600' },
  heroValue: {
    ...Type.display,
    color: Colors.accentInk,
    marginTop: Spacing.xs,
  },
  heroAside: { ...Type.meta, color: Colors.accentInk, opacity: 0.7, marginTop: 6 },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.accentInk,
    opacity: 0.15,
    marginVertical: Spacing.lg,
  },
  heroStats: { flexDirection: 'row', gap: Spacing.lg },

  sectionTitle: {
    ...Type.section,
    color: Colors.ink,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  emptyCard: { padding: Spacing.xl },
  empty: { ...Type.meta, color: Colors.inkMuted, lineHeight: 21 },
});
