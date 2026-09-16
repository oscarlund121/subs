import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Fonts,
  pressed,
  Radius,
  Spacing,
  TAB_BAR_CLEARANCE,
  Type,
} from '@/constants/theme';
import { api } from '@/lib/api';
import { Subscription } from '@/lib/types';
import {
  formatCurrency,
  monthlyEquivalent,
  monthlyTotals,
  primaryCurrency,
  trialsEndingSoon,
} from '@/lib/format';
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
      setError(
        e instanceof Error ? e.message : 'Could not load subscriptions.',
      );
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

  const live = subs.filter((s) => s.status !== 'cancelled');
  const trials = live.filter((s) => s.status === 'trial');
  const upcoming = [...live]
    .sort(
      (a, b) =>
        new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime(),
    )
    .slice(0, UPCOMING_COUNT);

  /**
   * Share of the headline figure that is still inside a free trial — money
   * that starts being charged unless something is cancelled. This is the one
   * number the app exists to surface, so it gets the kit's progress strip.
   */
  const trialShare = (() => {
    if (!main || !trials.length) return null;
    const trialSpend = trials
      .filter((s) => (s.currency || 'DKK') === main)
      .reduce((sum, s) => sum + monthlyEquivalent(s.price, s.cycle), 0);
    const total = totals[main];
    if (!total || !trialSpend) return null;
    return {
      pct: Math.min(100, Math.round((trialSpend / total) * 100)),
      amount: formatCurrency(trialSpend, main),
    };
  })();

  // Trials about to convert to paid — the reminder the app exists to surface.
  const endingSoon = trialsEndingSoon(live);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={Colors.onAccentMuted}
            />
          }
        >
          {/* Green header — bleeds up behind the status bar. */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerText}>
                <Text style={styles.headline}>Here's your month</Text>
                <Text style={styles.greeting}>{greeting()}</Text>
              </View>
              <Pressable
                onPress={() => router.push('/inbox')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Open inbox"
                style={(s) => [styles.bell, pressed(s)]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={Colors.ink}
                />
              </Pressable>
            </View>

            <View style={styles.headerStats}>
              <StatTile
                icon="wallet-outline"
                label="Monthly spend"
                value={main ? formatCurrency(totals[main], main) : '—'}
                caption={
                  others.length
                    ? `plus ${others
                        .map(([code, amount]) => formatCurrency(amount, code))
                        .join(' and ')}`
                    : undefined
                }
              />
              <View style={styles.headerRule} />
              <StatTile
                icon="hourglass-outline"
                label="On trial"
                value={String(trials.length)}
                caption={`${live.length} active`}
              />
            </View>

            {trialShare ? (
              <View style={styles.progressWrap}>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${trialShare.pct}%` }]}>
                    <Text style={styles.fillText}>{trialShare.pct}%</Text>
                  </View>
                  <Text style={styles.trackText}>{trialShare.amount}</Text>
                </View>
                <Text style={styles.progressNote}>
                  {trialShare.pct}% of your monthly spend is still on a free
                  trial.
                </Text>
              </View>
            ) : null}
          </View>

          {/* White sheet riding up over the header. */}
          <View style={styles.sheet}>
            {error ? <ErrorBanner message={error} onRetry={load} /> : null}

            {loading ? (
              <ActivityIndicator color={Colors.accent} style={styles.loading} />
            ) : (
              <>
                {endingSoon.length ? (
                  <View style={styles.trialAlert}>
                    <View style={styles.trialAlertHeader}>
                      <Ionicons
                        name="warning-outline"
                        size={18}
                        color={Colors.warning}
                      />
                      <Text style={styles.trialAlertTitle}>
                        {endingSoon.length === 1
                          ? 'Trial ending soon'
                          : 'Trials ending soon'}
                      </Text>
                    </View>
                    {endingSoon.map(({ sub, daysLeft }) => (
                      <Text key={sub.id} style={styles.trialAlertBody}>
                        <Text style={styles.trialAlertName}>{sub.name}</Text>{' '}
                        {daysLeft === 0
                          ? 'ends today'
                          : `ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}{' '}
                        — you will be charged{' '}
                        <Text style={styles.trialAlertName}>
                          {formatCurrency(sub.price, sub.currency)}
                        </Text>
                        .
                      </Text>
                    ))}
                  </View>
                ) : null}

                <Text style={styles.sectionTitle}>Coming up</Text>
                {upcoming.length ? (
                  <Card>
                    {upcoming.map((s, i) => (
                      <View key={s.id}>
                        {i > 0 ? <Separator inset={80} /> : null}
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
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.accent },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  /** flexGrow lets the sheet stretch to the bottom on short lists. */
  content: { flexGrow: 1 },

  header: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerText: { flex: 1, gap: 1 },
  headline: { ...Type.title, fontSize: 22, color: Colors.onAccent },
  greeting: { ...Type.meta, fontSize: 13, color: Colors.onAccentMuted },
  bell: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerStats: { flexDirection: 'row', gap: Spacing.lg },
  headerRule: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: Colors.onAccentMuted,
  },

  progressWrap: { gap: Spacing.sm },
  /** The kit's inline progress pill: dark fill, label riding inside it. */
  track: {
    height: 26,
    borderRadius: Radius.pill,
    backgroundColor: Colors.bg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    minWidth: 46,
    borderRadius: Radius.pill,
    backgroundColor: Colors.deep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  fillText: { ...Type.small, fontSize: 11, color: Colors.onDark },
  trackText: {
    ...Type.small,
    fontSize: 11,
    color: Colors.ink,
    marginLeft: 'auto',
    marginRight: Spacing.md,
  },
  progressNote: { ...Type.small, fontSize: 12, color: Colors.onAccentMuted },

  sheet: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: TAB_BAR_CLEARANCE,
    gap: Spacing.md,
  },
  loading: { marginTop: Spacing.xxl },
  sectionTitle: {
    ...Type.section,
    color: Colors.ink,
    marginLeft: Spacing.xs,
  },
  trialAlert: {
    backgroundColor: Colors.warningSoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  trialAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trialAlertTitle: {
    ...Type.meta,
    fontFamily: Fonts.subMedium,
    color: Colors.warning,
  },
  trialAlertBody: {
    ...Type.meta,
    fontSize: 13.5,
    color: Colors.inkSecondary,
    lineHeight: 20,
  },
  trialAlertName: { fontFamily: Fonts.subMedium, color: Colors.ink },
  emptyCard: { padding: Spacing.xl },
  empty: { ...Type.meta, color: Colors.inkMuted, lineHeight: 21 },
});
