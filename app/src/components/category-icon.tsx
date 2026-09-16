import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categoryVisual, Colors } from '@/constants/theme';

/**
 * The blue disc that anchors the left of every row — the kit's stand-in for a
 * service logo. Keyed on category rather than service name, so Netflix and
 * Disney+ read as the same kind of thing at a glance.
 */
export function CategoryIcon({
  category,
  size = 52,
}: {
  category: string | null | undefined;
  size?: number;
}) {
  const { icon, bg } = categoryVisual(category);
  return (
    <View
      style={[
        styles.disc,
        {
          width: size,
          height: size,
          // Not a full circle: the kit rounds to roughly a third, which keeps
          // the discs reading as tiles in a dense list.
          borderRadius: size * 0.34,
          backgroundColor: bg,
        },
      ]}
    >
      <Ionicons name={icon} size={size * 0.46} color={Colors.onDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { alignItems: 'center', justifyContent: 'center' },
});
