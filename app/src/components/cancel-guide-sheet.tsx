import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Colors, pressed, Radius, Shadow, Spacing, Type } from '@/constants/theme';
import { api } from '@/lib/api';
import type { CancelGuide, Subscription } from '@/lib/types';
import { Button } from './button';

/**
 * Bottom sheet that shows the "how to cancel" guide for a subscription and
 * deep-links to the vendor's own cancellation page. Discovery happens on the
 * backend the first time a service is asked for, so this only ever waits on
 * the network once per service.
 */
export function CancelGuideSheet({
  subscription,
  onClose,
  onCancelled,
}: {
  subscription: Subscription | null;
  onClose: () => void;
  /** Called after the user marks the subscription cancelled. */
  onCancelled?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [guide, setGuide] = useState<CancelGuide | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!subscription) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setGuide(null);
    setFallbackUrl(null);
    api
      .getCancelGuide(subscription.id)
      .then((res) => {
        if (cancelled) return;
        setGuide(res.guide);
        setFallbackUrl(res.fallbackUrl);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : 'Could not load the cancellation guide.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription?.id]);

  const url = guide?.cancelUrl ?? fallbackUrl;

  function openPage() {
    if (url) void WebBrowser.openBrowserAsync(url);
  }

  async function markCancelled() {
    if (!subscription) return;
    setBusy(true);
    try {
      await api.updateSubscription(subscription.id, { status: 'cancelled' });
      onCancelled?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not mark it cancelled.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible={subscription !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + Spacing.lg },
          ]}
        >
          <View style={styles.grabber} />

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Cancel {subscription?.name ?? ''}</Text>
            <Text style={styles.subtitle}>
              We'll point you to the right place — you finish the last click.
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator color={Colors.accent} style={styles.loading} />
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : guide ? (
              <>
                {guide.steps.length ? (
                  <View style={styles.steps}>
                    {guide.steps.map((step, i) => (
                      <View key={i} style={styles.stepRow}>
                        <View style={styles.stepBadge}>
                          <Text style={styles.stepBadgeText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <Button label="Open cancel page" onPress={openPage} />
                <Button
                  label="I've cancelled it"
                  variant="soft"
                  onPress={markCancelled}
                  busy={busy}
                  style={styles.secondary}
                />
              </>
            ) : (
              <>
                <Text style={styles.missing}>
                  We couldn't find a cancellation page for {subscription?.name}{' '}
                  yet. You can search for the steps instead.
                </Text>
                <Button label="Search how to cancel" onPress={openPage} />
                <Button
                  label="I've cancelled it"
                  variant="soft"
                  onPress={markCancelled}
                  busy={busy}
                  style={styles.secondary}
                />
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,29,26,0.35)',
    justifyContent: 'flex-end',
  },
  dismissArea: { flex: 1 },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    maxHeight: '92%',
    ...Shadow.sheet,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.fillStrong,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  titleBlock: { gap: Spacing.xs, marginBottom: Spacing.lg },
  title: { ...Type.title, fontSize: 24, color: Colors.ink },
  subtitle: { ...Type.meta, color: Colors.inkMuted, lineHeight: 20 },
  body: { gap: Spacing.lg, paddingBottom: Spacing.md },
  loading: { marginVertical: Spacing.xl },
  error: { ...Type.meta, color: Colors.danger },
  missing: { ...Type.body, color: Colors.inkSecondary, lineHeight: 22 },
  steps: { gap: Spacing.md, marginBottom: Spacing.sm },
  stepRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: { ...Type.small, color: Colors.accentInk, fontWeight: '700' },
  stepText: { ...Type.body, color: Colors.ink, flex: 1, lineHeight: 22 },
  secondary: { marginTop: Spacing.sm },
});
