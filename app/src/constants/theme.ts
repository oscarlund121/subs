import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Warm, quiet design language — paper-toned background, white cards floating on
 * soft shadows, a muted sage accent. Deliberately low-contrast and roomy: this
 * is a thing you glance at, not a dashboard you monitor.
 */
export const Colors = {
  /** Warm off-white the whole app sits on. */
  bg: '#F5F3EF',
  /** Cards and sheets — plain white reads as "raised" against the paper. */
  card: '#FFFFFF',
  /** Recessed fills: inputs, chips, avatar backgrounds. */
  fill: '#EFEDE8',
  fillStrong: '#E5E2DB',
  /** Hairline between rows inside a card. */
  separator: '#ECE9E3',

  ink: '#1F1D1A',
  inkSecondary: '#6B6660',
  inkMuted: '#9B958C',

  accent: '#3D7A68',
  accentInk: '#2F6152',
  accentSoft: '#E6EFEB',

  warning: '#A9702F',
  warningSoft: '#F6ECDF',

  danger: '#B04A3A',
  dangerSoft: '#F7E7E3',

  onAccent: '#FFFFFF',
} as const;

/**
 * Avatar tints, assigned per service name. Muted enough to sit side by side in
 * a list without any one of them shouting.
 */
export const AvatarTints = [
  { bg: '#E6EFEB', ink: '#3D7A68' },
  { bg: '#EDEAF6', ink: '#5B53A8' },
  { bg: '#F6ECDF', ink: '#A9702F' },
  { bg: '#F7E7E3', ink: '#B04A3A' },
  { bg: '#E4EDF4', ink: '#3A6B8C' },
  { bg: '#EFEDE3', ink: '#71753C' },
] as const;

/** Stable colour per name, so a service keeps its tint between sessions. */
export function avatarTint(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AvatarTints[hash % AvatarTints.length];
}

/** First letter of each of the first two words, e.g. "Disney Plus" → "DP". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
} as const;

/**
 * Type scale. System font throughout — no monospace, which read as
 * spreadsheet rather than app.
 */
export const Type = {
  display: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  section: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  meta: {
    fontSize: 14,
    fontWeight: '500',
  },
  small: {
    fontSize: 12.5,
    fontWeight: '600',
  },
} satisfies Record<string, TextStyle>;

/**
 * Two depths only. Cards lift a little; sheets lift a lot. Shadows are warm
 * and wide rather than dark and tight.
 */
export const Shadow = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#2A2118',
      shadowOpacity: 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
    },
    default: { elevation: 2 },
  })!,
  sheet: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#2A2118',
      shadowOpacity: 0.16,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: -6 },
    },
    default: { elevation: 16 },
  })!,
} as const;

/** Uniform press feedback — used by every Pressable in the app. */
export const pressed = (state: { pressed: boolean }) => ({
  opacity: state.pressed ? 0.6 : 1,
});
