import { StyleSheet, Text, View } from 'react-native';
import { avatarTint, initials } from '@/constants/theme';

/**
 * Stand-in for a service logo: the initials on a tint derived from the name.
 * Gives every row an anchor on the left, which is most of what makes a list
 * feel like an app rather than a table.
 */
export function Avatar({ name, size = 42 }: { name: string; size?: number }) {
  const tint = avatarTint(name);
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size * 0.34,
          backgroundColor: tint.bg,
        },
      ]}
    >
      <Text style={[styles.text, { color: tint.ink, fontSize: size * 0.36 }]}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700', letterSpacing: -0.3 },
});

