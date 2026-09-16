import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
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
  pressed,
  Radius,
  Shadow,
  Spacing,
  TAB_BAR_CLEARANCE,
  Type,
} from '@/constants/theme';
import { api } from '@/lib/api';
import { Subscription } from '@/lib/types';
import { formatCurrency, monthlyTotals, primaryCurrency } from '@/lib/format';
import { Separator } from '@/components/card';
import { SubscriptionRow } from '@/components/subscription-row';
import { AddSubscriptionModal } from '@/components/add-subscription-modal';
import { ErrorBanner } from '@/components/error-banner';
import {
  SubscriptionFormSheet,
  emptyFormValues,
  toDateInput,
  type SubscriptionFormValues,
} from '@/components/subscription-form-sheet';
import { CancelGuideSheet } from '@/components/cancel-guide-sheet';

function subscriptionToForm(sub: Subscription): SubscriptionFormValues {
  return {
    name: sub.name,
    category: sub.category,
    price: String(sub.price),
    currency: sub.currency,
    cycle: sub.cycle,
    nextRenewal: toDateInput(sub.nextRenewal),
  };
}

export default function SubscriptionsScreen() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addVisible, setAddVisible] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [cancelling, setCancelling] = useState<Subscription | null>(null);

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

  function confirmDelete(sub: Subscription) {
    Alert.alert(
      `Delete ${sub.name}?`,
      'This removes it from your list. It can come back if the same service is detected in your email again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setEditing(null);
            try {
              await api.deleteSubscription(sub.id);
              setError(null);
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not delete it.');
            }
          },
        },
      ],
    );
  }

  const totals = monthlyTotals(subs);
  const main = primaryCurrency(totals);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Green header — the same block Home opens with. */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Subscriptions</Text>
            <Text style={styles.subtitle}>
              {subs.length} tracked
              {main ? ` · ${formatCurrency(totals[main], main)} a month` : ''}
            </Text>
          </View>
          <Pressable
            onPress={() => setAddVisible(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add a subscription"
            style={(s) => [styles.addBtn, pressed(s)]}
          >
            <Ionicons name="add" size={26} color={Colors.onAccent} />
          </Pressable>
        </View>

        <View style={styles.sheet}>
          {error ? (
            <View style={styles.banner}>
              <ErrorBanner message={error} onRetry={load} />
            </View>
          ) : null}

          {loading ? (
            <ActivityIndicator color={Colors.accent} style={styles.loading} />
          ) : (
            <FlatList
              data={subs}
              keyExtractor={(s) => s.id}
              style={styles.list}
              contentContainerStyle={
                subs.length ? styles.group : styles.groupEmpty
              }
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <Separator inset={80} />}
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
                <SubscriptionRow sub={item} onPress={setEditing} />
              )}
              ListEmptyComponent={
                error ? null : (
                  <Text style={styles.empty}>
                    Nothing tracked yet. Check the Inbox tab for subscriptions
                    found in your email, or add one by hand.
                  </Text>
                )
              }
            />
          )}
        </View>

        <AddSubscriptionModal
          visible={addVisible}
          onClose={() => setAddVisible(false)}
          onCreated={load}
        />

        <SubscriptionFormSheet
          visible={editing !== null}
          title={editing?.name ?? ''}
          submitLabel="Save changes"
          initial={editing ? subscriptionToForm(editing) : emptyFormValues()}
          onCancel={() => setEditing(null)}
          onDelete={editing ? () => confirmDelete(editing) : undefined}
          onCancelSubscription={
            editing
              ? () => {
                  const sub = editing;
                  setEditing(null);
                  setCancelling(sub);
                }
              : undefined
          }
          onSubmit={async (values) => {
            await api.updateSubscription(editing!.id, values);
            setEditing(null);
            await load();
          }}
        />

        <CancelGuideSheet
          subscription={cancelling}
          onClose={() => setCancelling(null)}
          onCancelled={load}
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
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** The sheet the list rides in, riding up over the green. */
  sheet: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.xl,
  },
  banner: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  loading: { marginTop: Spacing.xxl },
  list: { flex: 1 },
  /** The content itself is the card, so rows read as one continuous panel. */
  group: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: TAB_BAR_CLEARANCE,
    ...Shadow.card,
  },
  groupEmpty: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  empty: { ...Type.meta, color: Colors.inkMuted, lineHeight: 21 },
});
