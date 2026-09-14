import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { Cycle } from '@/lib/types';

const CYCLES: Cycle[] = ['weekly', 'monthly', 'quarterly', 'yearly'];

export function AddSubscriptionModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Other');
  const [price, setPrice] = useState('');
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim() || !price.trim()) {
      setError('Name and price are required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.createSubscription({
        name: name.trim(),
        category: category.trim() || 'Other',
        price: parseFloat(price.replace(',', '.')),
        currency: 'DKK',
        cycle,
        nextRenewal: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        status: 'active',
        source: 'Manual',
      });
      setName('');
      setPrice('');
      setCategory('Other');
      setCycle('monthly');
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Add subscription</Text>

          <TextInput
            style={styles.input}
            placeholder="Name (e.g. Netflix)"
            placeholderTextColor={Colors.inkMuted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Price (DKK)"
            placeholderTextColor={Colors.inkMuted}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Category"
            placeholderTextColor={Colors.inkMuted}
            value={category}
            onChangeText={setCategory}
          />

          <View style={styles.cycleRow}>
            {CYCLES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCycle(c)}
                style={[styles.cycleBtn, cycle === c && styles.cycleBtnActive]}
              >
                <Text
                  style={[styles.cycleText, cycle === c && styles.cycleTextActive]}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={submit} disabled={busy} style={styles.submitBtn}>
              {busy ? (
                <ActivityIndicator color={Colors.bg} />
              ) : (
                <Text style={styles.submitText}>Add</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    backgroundColor: '#0e0e10',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    color: Colors.ink,
    fontSize: 20,
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.ink,
    fontSize: 15,
  },
  cycleRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  cycleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cycleBtnActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.borderGlow,
  },
  cycleText: { color: Colors.inkSecondary, fontSize: 13 },
  cycleTextActive: { color: Colors.accent, fontWeight: '600' },
  error: { color: Colors.danger, fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  cancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: { color: Colors.inkSecondary, fontWeight: '600' },
  submitBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  submitText: { color: Colors.bg, fontWeight: '700' },
});
