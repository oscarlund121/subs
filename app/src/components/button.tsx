import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import {
  Colors,
  Fonts,
  pressed,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';

export type ButtonVariant =
  | 'primary'
  | 'soft'
  | 'quiet'
  | 'destructive'
  /** For buttons sitting on the green header, where `soft` would vanish. */
  | 'onAccent';

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  busy,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isOff = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={isOff}
      style={(state) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        styles[variant],
        isOff && styles.off,
        pressed(state),
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator
          size="small"
          color={variant === 'soft' ? Colors.accentInk : Colors.ink}
        />
      ) : (
        <Text
          style={[
            styles.label,
            size === 'sm' && styles.labelSm,
            styles[`${variant}Label`],
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: { paddingHorizontal: Spacing.xl, paddingVertical: 14, minHeight: 50 },
  sm: { paddingHorizontal: Spacing.lg, paddingVertical: 9, minHeight: 36 },
  off: { opacity: 0.5 },

  primary: { backgroundColor: Colors.accent },
  soft: { backgroundColor: Colors.accentSoft },
  quiet: { backgroundColor: Colors.fill },
  destructive: { backgroundColor: Colors.dangerSoft },
  onAccent: { backgroundColor: Colors.bg },

  label: { ...Type.body, fontFamily: Fonts.semibold },
  labelSm: { fontSize: 14 },
  primaryLabel: { color: Colors.onAccent },
  softLabel: { color: Colors.accentInk },
  quietLabel: { color: Colors.inkSecondary },
  destructiveLabel: { color: Colors.danger },
  onAccentLabel: { color: Colors.ink },
});
