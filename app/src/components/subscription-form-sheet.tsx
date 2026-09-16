import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, pressed, Radius, Shadow, Spacing, Type } from '@/constants/theme';
import { CYCLES, type Cycle } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { Button } from './button';

export interface SubscriptionFormValues {
  name: string;
  category: string;
  /** Free text while editing; parsed on submit. */
  price: string;
  currency: string;
  cycle: Cycle;
  /** `YYYY-MM-DD`. */
  nextRenewal: string;
}

export interface SubscriptionFormResult {
  name: string;
  category: string;
  price: number;
  currency: string;
  cycle: Cycle;
  /** Full ISO timestamp, ready for the API. */
  nextRenewal: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The sheet opens over a tab screen, and the tab bar keeps drawing on top of
 * it, so the last controls need room to clear it.
 */
const TAB_BAR_CLEARANCE = 56;

const CYCLE_LABELS: Record<Cycle, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export function emptyFormValues(): SubscriptionFormValues {
  const inAMonth = new Date();
  inAMonth.setMonth(inAMonth.getMonth() + 1);
  return {
    name: '',
    category: 'Other',
    price: '',
    currency: 'DKK',
    cycle: 'monthly',
    nextRenewal: inAMonth.toISOString().slice(0, 10),
  };
}

/**
 * The one place subscription fields are edited — shared by "add", "edit" and
 * the review step when confirming a detected subscription. Presented as a
 * bottom sheet so it arrives from where the thumb already is.
 */
export function SubscriptionFormSheet({
  visible,
  title,
  submitLabel,
  initial,
  hint,
  onCancel,
  onSubmit,
  onDelete,
  onCancelSubscription,
}: {
  visible: boolean;
  title: string;
  submitLabel: string;
  initial: SubscriptionFormValues;
  /** Optional line under the title, e.g. where the values came from. */
  hint?: string;
  onCancel: () => void;
  onSubmit: (values: SubscriptionFormResult) => Promise<void>;
  /** When given, the sheet offers to remove the record it is editing. */
  onDelete?: () => void;
  /** When given, the sheet offers to cancel the subscription at the source. */
  onCancelSubscription?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed whenever a different record is opened.
  useEffect(() => {
    if (visible) {
      setValues(initial);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initial.name, initial.price, initial.nextRenewal]);

  const set = <K extends keyof SubscriptionFormValues>(
    key: K,
    value: SubscriptionFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  async function submit() {
    const name = values.name.trim();
    if (!name) return setError('Give it a name.');

    const price = Number.parseFloat(values.price.replace(',', '.'));
    if (!Number.isFinite(price) || price < 0) {
      return setError('Enter a valid price.');
    }

    if (!DATE_PATTERN.test(values.nextRenewal)) {
      return setError('Renewal date must look like 2026-04-15.');
    }
    const renewal = new Date(`${values.nextRenewal}T12:00:00.000Z`);
    if (Number.isNaN(renewal.getTime())) {
      return setError('That renewal date does not exist.');
    }

    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        name,
        category: values.category.trim() || 'Other',
        price,
        currency: values.currency.trim().toUpperCase() || 'DKK',
        cycle: values.cycle,
        nextRenewal: renewal.toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  // Echo the typed date back in words, so a typo is obvious before saving.
  const renewalPreview = DATE_PATTERN.test(values.nextRenewal)
    ? formatDate(`${values.nextRenewal}T12:00:00.000Z`)
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onCancel} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.grabber} />

            <View style={styles.titleBlock}>
              <Text style={styles.title}>{title}</Text>
              {hint ? <Text style={styles.hint}>{hint}</Text> : null}
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.form,
                { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Field label="Name">
                <TextInput
                  style={styles.input}
                  placeholder="Netflix"
                  placeholderTextColor={Colors.inkMuted}
                  value={values.name}
                  onChangeText={(v) => set('name', v)}
                />
              </Field>

              <View style={styles.pair}>
                <Field label="Price" style={styles.grow}>
                  <TextInput
                    style={styles.input}
                    placeholder="129"
                    placeholderTextColor={Colors.inkMuted}
                    value={values.price}
                    onChangeText={(v) => set('price', v)}
                    keyboardType="decimal-pad"
                  />
                </Field>
                <Field label="Currency" style={styles.currencyField}>
                  <TextInput
                    style={styles.input}
                    placeholder="DKK"
                    placeholderTextColor={Colors.inkMuted}
                    value={values.currency}
                    onChangeText={(v) => set('currency', v)}
                    autoCapitalize="characters"
                    maxLength={3}
                  />
                </Field>
              </View>

              <Field label="Category">
                <TextInput
                  style={styles.input}
                  placeholder="Streaming"
                  placeholderTextColor={Colors.inkMuted}
                  value={values.category}
                  onChangeText={(v) => set('category', v)}
                />
              </Field>

              <Field label="Billing cycle">
                <View style={styles.segment}>
                  {CYCLES.map((c: Cycle) => {
                    const active = values.cycle === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => set('cycle', c)}
                        style={[styles.segmentItem, active && styles.segmentItemActive]}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            active && styles.segmentTextActive,
                          ]}
                        >
                          {CYCLE_LABELS[c]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>

              <Field label="Next renewal">
                <TextInput
                  style={styles.input}
                  placeholder="2026-04-15"
                  placeholderTextColor={Colors.inkMuted}
                  value={values.nextRenewal}
                  onChangeText={(v) => set('nextRenewal', v)}
                  autoCapitalize="none"
                />
                {renewalPreview ? (
                  <Text style={styles.caption}>{renewalPreview}</Text>
                ) : null}
              </Field>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                label={submitLabel}
                onPress={submit}
                busy={busy}
                style={styles.submit}
              />
              {onCancelSubscription ? (
                <View style={styles.cancelSubBlock}>
                  <Button
                    label="Cancel subscription"
                    variant="soft"
                    onPress={onCancelSubscription}
                  />
                  <Text style={styles.cancelSubCaption}>
                    Opens the service's own cancellation page — you finish the
                    last click.
                  </Text>
                </View>
              ) : null}

              <Pressable onPress={onCancel} style={pressed}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>

              {onDelete ? (
                <Pressable onPress={onDelete} style={pressed}>
                  <Text style={styles.delete}>Delete subscription</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Field({
  label,
  style,
  children,
}: {
  label: string;
  style?: object;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
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
  titleBlock: { paddingHorizontal: Spacing.xl, gap: Spacing.xs },
  title: { ...Type.title, fontSize: 24, color: Colors.ink },
  hint: { ...Type.meta, color: Colors.inkMuted, lineHeight: 20 },
  form: { padding: Spacing.xl, gap: Spacing.lg },
  field: { gap: Spacing.sm },
  grow: { flex: 1 },
  currencyField: { width: 104 },
  pair: { flexDirection: 'row', gap: Spacing.md },
  label: { ...Type.meta, color: Colors.inkSecondary, fontWeight: '600' },
  input: {
    backgroundColor: Colors.fill,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    color: Colors.ink,
    fontSize: 16,
  },
  caption: { ...Type.small, color: Colors.inkMuted, fontWeight: '500' },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.fill,
    borderRadius: Radius.pill,
    padding: 4,
    gap: 2,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: Colors.card, ...Shadow.card },
  segmentText: { ...Type.small, color: Colors.inkSecondary },
  segmentTextActive: { color: Colors.ink },
  error: { ...Type.meta, color: Colors.danger },
  submit: { marginTop: Spacing.xs },
  cancel: {
    ...Type.body,
    color: Colors.inkSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  cancelSubBlock: { gap: Spacing.xs },
  cancelSubCaption: {
    ...Type.small,
    color: Colors.inkMuted,
    textAlign: 'center',
  },
  delete: {
    ...Type.meta,
    color: Colors.danger,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});
