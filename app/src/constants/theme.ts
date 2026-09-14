import { Platform } from 'react-native';

/**
 * Dark cinematic glass theme — OLED black, cyan glow, glass surfaces.
 * Matches the Subs web prototype (subscriptions.pibosh.com).
 */
export const Colors = {
  bg: '#050505',
  surface: 'rgba(255,255,255,0.04)',
  surfaceStrong: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.09)',
  borderGlow: 'rgba(34,211,238,0.35)',
  ink: '#f5f5f5',
  inkSecondary: '#a1a1aa',
  inkMuted: '#5b5b63',
  accent: '#22d3ee',
  accentDim: 'rgba(34,211,238,0.14)',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const Fonts = {
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
  sans: Platform.select({ ios: 'system-ui', default: 'normal' }),
};
