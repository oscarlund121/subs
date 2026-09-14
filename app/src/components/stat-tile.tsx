import { StyleSheet, Text, View } from 'react-native';
import { Colors, Type } from '@/constants/theme';

/**
 * A number and its label, sized to sit in a row beneath the headline figure on
 * Home. Intentionally flat — the card around it already provides the surface.
 */
export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, gap: 2 },
  value: { ...Type.section, fontSize: 19, color: Colors.ink },
  label: { ...Type.meta, color: Colors.inkMuted },
});
