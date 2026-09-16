import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Type } from '@/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * One column of the green header block — a small captioned figure, sized to
 * sit either side of a vertical rule. Reads on `Colors.accent`, so everything
 * here uses the `onAccent` pair rather than the ink scale.
 */
export function StatTile({
  icon,
  label,
  value,
  caption,
}: {
  icon: IconName;
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <View style={styles.tile}>
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={14} color={Colors.onAccentMuted} />
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {value}
      </Text>
      {caption ? (
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { ...Type.meta, fontSize: 13, color: Colors.onAccentMuted },
  value: {
    ...Type.display,
    fontSize: 26,
    lineHeight: 30,
    color: Colors.onAccent,
  },
  caption: { ...Type.small, fontSize: 12, color: Colors.onAccentMuted },
});
