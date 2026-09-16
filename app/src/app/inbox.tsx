import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Radius,
  Spacing,
  TAB_BAR_CLEARANCE,
  Type,
} from '@/constants/theme';
import { api } from '@/lib/api';
import { Detection } from '@/lib/types';
import { Button } from '@/components/button';
import { DetectionRow } from '@/components/detection-row';
import { ErrorBanner } from '@/components/error-banner';
import {
  SubscriptionFormSheet,
  emptyFormValues,
  toDateInput,
  type SubscriptionFormValues,
} from '@/components/subscription-form-sheet';

/** Seed the review sheet with whatever the parser managed to extract. */
function detectionToForm(det: Detection): SubscriptionFormValues {
  const fallback = emptyFormValues();
  return {
    name: det.service ?? '',
    category: det.category ?? 'Other',
    price: det.price !== null ? String(det.price) : '',
    currency: det.currency ?? 'DKK',
    cycle: det.cycle ?? 'monthly',
    nextRenewal:
      toDateInput(det.trialEndsAt ?? det.renewalAt) || fallback.nextRenewal,
  };
}

export default function InboxScreen() {
  const [dets, setDets] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<Detection | null>(null);

  const load = useCallback(async () => {
    try {
      setDets(await api.listDetections());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load detections.');
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

  async function scanNow() {
    setScanning(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.scanEmail();
      setNotice(
        result.detected > 0
          ? `Found ${result.detected} subscription${result.detected === 1 ? '' : 's'} in ${result.scanned} new email${result.scanned === 1 ? '' : 's'}.`
          : `Scanned ${result.scanned} new email${result.scanned === 1 ? '' : 's'} — nothing new.`,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed.');
    } finally {
      setScanning(false);
    }
  }

  async function act(fn: () => Promise<unknown>) {
    try {
      await fn();
      setError(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not work.');
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Green header — the same block Home opens with. */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Inbox</Text>
            <Text style={styles.subtitle}>
              {loading
                ? 'Looking for subscriptions…'
                : dets.length
                  ? `${dets.length} waiting for you`
                  : 'Subscriptions found in your email land here'}
            </Text>
          </View>
          <Button
            label="Scan"
            size="sm"
            variant="onAccent"
            busy={scanning}
            onPress={scanNow}
            style={styles.scanBtn}
          />
        </View>

        <View style={styles.sheet}>
          {error ? (
            <View style={styles.banner}>
              <ErrorBanner message={error} onRetry={load} />
            </View>
          ) : null}
          {notice && !error ? (
            <View style={styles.banner}>
              <Text style={styles.notice}>{notice}</Text>
            </View>
          ) : null}

          {loading ? (
            <ActivityIndicator color={Colors.accent} style={styles.loading} />
          ) : (
            <FlatList
              data={dets}
              keyExtractor={(d) => d.id}
              contentContainerStyle={styles.list}
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
              renderItem={({ item }) => (
                <DetectionRow
                  det={item}
                  onConfirm={() => act(() => api.confirmDetection(item.id))}
                  onReview={() => setReviewing(item)}
                  onIgnore={() => act(() => api.ignoreDetection(item.id))}
                />
              )}
              ListEmptyComponent={
                error ? null : (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                      <Ionicons
                        name="sparkles-outline"
                        size={26}
                        color={Colors.accent}
                      />
                    </View>
                    <Text style={styles.emptyTitle}>You're all caught up</Text>
                    <Text style={styles.emptyBody}>
                      Nothing to review right now. Scan your email and anything
                      that looks like a subscription will show up here.
                    </Text>
                    <Button
                      label="Scan my email"
                      variant="primary"
                      busy={scanning}
                      onPress={scanNow}
                      style={styles.emptyBtn}
                    />
                  </View>
                )
              }
            />
          )}
        </View>

        <SubscriptionFormSheet
          visible={reviewing !== null}
          title="Check the details"
          submitLabel="Add subscription"
          hint={
            reviewing?.subject
              ? `From the email “${reviewing.subject}”`
              : undefined
          }
          initial={reviewing ? detectionToForm(reviewing) : emptyFormValues()}
          onCancel={() => setReviewing(null)}
          onSubmit={async (values) => {
            const id = reviewing!.id;
            setReviewing(null);
            await act(() => api.confirmDetection(id, values));
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.accent },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  headerText: { flex: 1, gap: 2 },
  title: { ...Type.title, fontSize: 22, color: Colors.onAccent },
  subtitle: { ...Type.meta, fontSize: 13, color: Colors.onAccentMuted },
  /** The sheet the queue rides in, riding up over the green. */
  sheet: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.xl,
  },
  scanBtn: { minWidth: 84 },
  banner: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  notice: {
    ...Type.meta,
    color: Colors.accentInk,
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    lineHeight: 20,
  },
  loading: { marginTop: Spacing.xxl },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: TAB_BAR_CLEARANCE,
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: { ...Type.section, color: Colors.ink },
  emptyBody: {
    ...Type.meta,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyBtn: { marginTop: Spacing.md, alignSelf: 'stretch' },
});
