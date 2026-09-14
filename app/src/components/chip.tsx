import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Type } from '@/constants/theme';

export type ChipTone = 'neutral' | 'accent' | 'warning' | 'danger';

const TONES: Record<ChipTone, { bg: string; ink: string }> = {
  neutral: { bg: Colors.fill, ink: Colors.inkSecondary },
  accent: { bg: Colors.accentSoft, ink: Colors.accentInk },
  warning: { bg: Colors.warningSoft, ink: Colors.warning },
  danger: { bg: Colors.dangerSoft, ink: Colors.danger },
};

/** Soft-filled label. No borders anywhere — tint carries the meaning. */
export function Chip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: ChipTone;
}) {
  const { bg, ink } = TONES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: ink }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  text: { ...Type.small, fontSize: 12 },
});

