import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { Detection } from '@/lib/types';
import { DetectionRow } from '@/components/detection-row';

export default function InboxScreen() {
  const [dets, setDets] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setDets(await api.listDetections());
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

  async function confirm(id: string) {
    try {
      await api.confirmDetection(id);
      load();
    } catch {
      /* ignore */
    }
  }

  async function ignore(id: string) {
    try {
      await api.ignoreDetection(id);
      load();
    } catch {
      /* ignore */
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        <Text style={styles.subtitle}>
          {dets.length} pending — confirm or dismiss
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={styles.loading} />
      ) : (
        <FlatList
          data={dets}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <DetectionRow
              det={item}
              onConfirm={() => confirm(item.id)}
              onIgnore={() => ignore(item.id)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nothing pending. New emails from your inbox will show up here.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { color: Colors.ink, fontSize: 26, fontWeight: '800' },
  subtitle: { color: Colors.inkSecondary, fontSize: 13 },
  loading: { marginTop: Spacing.xl },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  empty: { color: Colors.inkMuted, fontSize: 14, lineHeight: 20 },
});
