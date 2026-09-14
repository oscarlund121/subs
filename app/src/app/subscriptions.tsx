import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { Subscription } from '@/lib/types';
import { SubscriptionRow } from '@/components/subscription-row';
import { AddSubscriptionModal } from '@/components/add-subscription-modal';

export default function SubscriptionsScreen() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      setSubs(await api.listSubscriptions());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleDelete(id: string) {
    try {
      await api.deleteSubscription(id);
      load();
    } catch {
      /* ignore */
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Subscriptions</Text>
          <Text style={styles.subtitle}>{subs.length} total</Text>
        </View>
        <Pressable onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={styles.loading} />
      ) : (
        <FlatList
          data={subs}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SubscriptionRow sub={item} onDelete={handleDelete} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No subscriptions yet.</Text>
          }
        />
      )}

      <AddSubscriptionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={load}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { color: Colors.ink, fontSize: 26, fontWeight: '800' },
  subtitle: { color: Colors.inkSecondary, fontSize: 13 },
  addBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  addBtnText: { color: Colors.bg, fontWeight: '700' },
  loading: { marginTop: Spacing.xl },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  empty: { color: Colors.inkMuted, fontSize: 14 },
});
