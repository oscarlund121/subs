import { Platform, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * FinWise design language: a saturated mint-green header bleeding from the
 * status bar, with a near-white sheet riding up over it on a large radius.
 * Dark teal ink throughout — never black — and blue-tinted category discs.
 *
 * Token values come from the Figma kit's published variables, so the names
 * below in comments are the Figma names.
 */
export const Colors = {
  /** "Background Green White" — the sheet the content sits on. */
  bg: '#F1FFF3',
  card: '#FFFFFF',
  /** "Light Green" — recessed fills: inputs, chips, segment tracks. */
  fill: '#DFF7E2',
  fillStrong: '#C9F0D4',
  separator: '#DCEFE0',

  /** "Letters and Icons". */
  ink: '#093030',
  inkSecondary: '#2C5A54',
  inkMuted: '#6E8F8A',

  /** "Main Green". */
  accent: '#00D09E',
  /** Green dark enough to read as text on `accentSoft`. */
  accentInk: '#0A7F66',
  accentSoft: '#DFF7E2',

  /**
   * "Background dark mode and letters" — used here for the deep end of the
   * header gradient and for filled progress tracks.
   */
  deep: '#052224',

  /**
   * The kit sets dark ink on mint, not white — white on #00D09E is barely
   * 2:1. Everything sitting on `accent` uses these.
   */
  onAccent: '#093030',
  onAccentMuted: 'rgba(9, 48, 48, 0.62)',

  /** Text and icons on dark surfaces: the deep teal, the category discs. */
  onDark: '#FFFFFF',
  /** Modal scrim — deep teal rather than neutral black, to match the ink. */
  scrim: 'rgba(5, 34, 36, 0.45)',

  warning: '#B8730C',
  warningSoft: '#FBEEDA',

  danger: '#D24B45',
  dangerSoft: '#FBE6E4',
  /** Tint for controls sitting inside a `dangerSoft` surface. */
  dangerFill: 'rgba(210, 75, 69, 0.12)',
} as const;

/** Registered in the root layout; referenced by `Type` below. */
export const Fonts = {
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  /** League Spartan — the kit's face for dense secondary text. */
  sub: 'LeagueSpartan_400Regular',
  subMedium: 'LeagueSpartan_500Medium',
} as const;

type IconName = keyof typeof Ionicons.glyphMap;

/** The kit's three blues, plus Main Green for the "smart" categories. */
const DISC_BLUES = ['#6DB6FE', '#3299FF', '#0068FF'] as const;

/**
 * Category discs. The backend's merchant table emits exactly these categories
 * (plus "Other"), so they are assigned by hand rather than hashed — Streaming
 * and Music keep their colours run to run, which is what makes a list
 * scannable. Anything unrecognised falls back to a hashed blue.
 */
const CATEGORY_VISUALS: Record<string, { icon: IconName; bg: string }> = {
  Streaming: { icon: 'play', bg: '#3299FF' },
  Music: { icon: 'musical-notes', bg: '#6DB6FE' },
  Gaming: { icon: 'game-controller', bg: '#0068FF' },
  News: { icon: 'newspaper', bg: '#6DB6FE' },
  Software: { icon: 'cube', bg: '#0068FF' },
  Developer: { icon: 'code-slash', bg: '#3299FF' },
  AI: { icon: 'sparkles', bg: '#00D09E' },
  Cloud: { icon: 'cloud', bg: '#6DB6FE' },
  Productivity: { icon: 'checkmark-done', bg: '#00D09E' },
  Fitness: { icon: 'barbell', bg: '#3299FF' },
  Telecom: { icon: 'cellular', bg: '#0068FF' },
  Other: { icon: 'pricetag', bg: '#6DB6FE' },
};

/** Icon + disc colour for a category. Case-insensitive; never throws. */
export function categoryVisual(category: string | null | undefined): {
  icon: IconName;
  bg: string;
} {
  const key = (category ?? '').trim();
  if (!key) return CATEGORY_VISUALS.Other;

  const exact = Object.keys(CATEGORY_VISUALS).find(
    (k) => k.toLowerCase() === key.toLowerCase(),
  );
  if (exact) return CATEGORY_VISUALS[exact];

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return { icon: 'pricetag', bg: DISC_BLUES[hash % DISC_BLUES.length] };
}

/**
 * Vertical room a screen must leave at the bottom so the floating tab bar
 * never sits on top of the last row.
 */
export const TAB_BAR_CLEARANCE = 108;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** The kit runs soft — `xl` is the radius on the sheet that overlaps the header. */
export const Radius = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 40,
  pill: 999,
} as const;

/**
 * Poppins for everything structural, League Spartan for secondary text.
 *
 * No `fontWeight` anywhere: with a custom `fontFamily`, Android ignores the
 * weight outright and iOS fakes it. Weight lives in the family name instead,
 * so pick the entry you want rather than overriding weight at the call site.
 */
export const Type = {
  display: {
    fontFamily: Fonts.bold,
    fontSize: 34,
    letterSpacing: -0.8,
  },
  /** Figma "Titlle" — screen headings. */
  title: {
    fontFamily: Fonts.semibold,
    fontSize: 20,
    lineHeight: 26,
  },
  section: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
  },
  /** Figma "Subtitle" — row names, button labels. */
  body: {
    fontFamily: Fonts.medium,
    fontSize: 15,
  },
  /** Figma "Subtext" — the League Spartan secondary line. */
  meta: {
    fontFamily: Fonts.sub,
    fontSize: 14,
  },
  /** Figma "Paragraph". */
  small: {
    fontFamily: Fonts.light,
    fontSize: 13,
  },
  /** Amounts and counts — tabular-ish, a touch tighter than `body`. */
  amount: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    letterSpacing: -0.2,
  },
} satisfies Record<string, TextStyle>;

/**
 * Flatter than the old paper theme — the kit separates surfaces with tint,
 * not depth, so shadows only need to keep white cards off the mint.
 */
export const Shadow = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#052224',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 3 },
    },
    default: { elevation: 2 },
  })!,
  sheet: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#052224',
      shadowOpacity: 0.14,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: -6 },
    },
    default: { elevation: 16 },
  })!,
  /** The floating tab bar lifts off the sheet rather than sinking into it. */
  nav: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#052224',
      shadowOpacity: 0.1,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
    },
    default: { elevation: 12 },
  })!,
} as const;

/** Uniform press feedback — used by every Pressable in the app. */
export const pressed = (state: { pressed: boolean }) => ({
  opacity: state.pressed ? 0.6 : 1,
});
