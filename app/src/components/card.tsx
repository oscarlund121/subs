import { StyleSheet, View, ViewProps } from 'react-native';
import { Colors, Radius, Shadow } from '@/constants/theme';

/** A white surface floating on the paper background. */
export function Card({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

/**
 * Hairline between rows of a grouped list. Inset from the left so it lines up
 * under the text rather than cutting across the avatar.
 */
export function Separator({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.separator, { marginLeft: inset }]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
  },
});
