/**
 * Theme Configuration — Single source of truth for mobile UI
 *
 * 2026 Design System following:
 * - Apple HIG / Material 3 guidelines
 * - Modern mental health app trends (Headspace, Calm, Ten Percent Happier)
 * - Glassmorphism, bold accents, micro-interactions
 * - 4px grid for spacing
 * - Min touch target 44pt (layout.touchTargetMin)
 */

import { Platform } from 'react-native';

/** Spacing scale — 4px grid (Apple HIG, Material) */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

/** Border radius — semantic scale with modern larger radii */
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  round: 9999,
} as const;

/** Elevation — cross-platform shadows with glassmorphism support */
export const elevation = {
  none: Platform.select({
    ios: {},
    android: { elevation: 0 },
    web: {},
  }),
  low: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    android: { elevation: 1 },
    web: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    web: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' },
  }),
  high: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    web: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)' },
  }),
  glow: Platform.select({
    ios: {
      shadowColor: '#FF6B6B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    web: { boxShadow: '0 4px 16px rgba(255, 107, 107, 0.3)' },
  }),
} as const;

// Gradient colors - calming depth with warmer accents
const lightGradients = {
  // Primary brand gradients (prefixed with 'gradient' to avoid collision)
  gradientPrimary: ['#0F766E', '#0284C7'] as const, // Calm teal to sky
  gradientSecondary: ['#EA580C', '#F59E0B'] as const, // Warm coral to amber
  gradientAccent: ['#22C55E', '#14B8A6'] as const, // Fresh green to teal

  // Mood-based gradients (for mood cards)
  gradientHappy: ['#FBBF24', '#F59E0B'] as const, // Warm sunlight
  gradientCalm: ['#38BDF8', '#0EA5E9'] as const, // Tranquil ocean
  gradientSad: ['#64748B', '#0F766E'] as const, // Grounded slate-teal
  gradientAnxious: ['#FDBA74', '#FB7185'] as const, // Soft amber-rose
  gradientEnergetic: ['#F97316', '#EF4444'] as const, // Bright coral

  // Feature card gradients
  cardGradient1: ['#F8FCFB', '#EEF8F5'] as const, // Soft mint
  cardGradient2: ['#F0F9FF', '#E0F2FE'] as const, // Soft sky
  cardGradient3: ['#F7FEE7', '#ECFCCB'] as const, // Soft lime
  cardGradient4: ['#FFF7ED', '#FFEDD5'] as const, // Soft amber
  cardGradient5: ['#FFF1F2', '#FFE4E6'] as const, // Soft rose
  cardGradient6: ['#F8FAFC', '#E2E8F0'] as const, // Soft slate

  // Glassmorphism backgrounds
  glass: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.6)'] as const,
  glassSubtle: ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)'] as const,
  canvasGradient: ['#F7FBFA', '#EAF4F2'] as const,
  heroGradient: ['#0F766E', '#0369A1'] as const,
};

// Light theme - Clean, airy, modern wellness aesthetic
export const lightTheme = {
  mode: 'light' as const,
  colors: {
    // Brand colors - 2026 trend: bold accent on calm base
    primary: '#0F766E', // Deep teal - steady and calming
    primaryLight: '#99F6E4', // Light teal
    primaryDark: '#115E59', // Dense teal
    secondary: '#EA580C', // Warm coral - humane energy
    secondaryLight: '#FED7AA', // Soft peach
    accent: '#0284C7', // Sky blue - clarity
    accentLight: '#BAE6FD', // Light sky

    // Semantic colors
    success: '#16A34A', // Green
    successLight: '#DCFCE7',
    warning: '#D97706', // Amber
    warningLight: '#FEF3C7',
    error: '#DC2626', // Red
    errorLight: '#FEE2E2',
    info: '#2563EB', // Blue
    infoLight: '#DBEAFE',

    // Neutrals - warm grays for mental wellness apps
    background: '#F4F7F6', // Soft mineral
    background2: '#ECF3F1', // Secondary bg
    surface: '#FFFFFF', // Cards
    surface2: '#F8FCFB', // Elevated surface
    surfaceGlass: 'rgba(255, 255, 255, 0.82)', // Glassmorphism

    // Text hierarchy
    text: '#102A2A', // Deep charcoal-teal
    text2: '#4B635F', // Secondary
    text3: '#80928E', // Tertiary
    textInverse: '#FFFFFF', // White text on dark

    // Interactive elements
    border: '#D7E3E0', // Subtle borders
    border2: '#C2D3CF', // Medium borders
    borderFocus: '#0F766E', // Focus state
    placeholder: '#90A4A0', // Placeholder text
    input: '#F1F7F5', // Input backgrounds
    inputFocus: '#E0F2F1', // Input focus bg

    // States
    disabled: '#C9D7D3',
    disabledText: '#8B9B97',
    overlay: 'rgba(8, 15, 15, 0.52)',
    overlayLight: 'rgba(8, 15, 15, 0.18)',

    // Special
    white: '#FFFFFF',
    black: '#000000',

    // Gradients
    ...lightGradients,

    // Visual system helpers
    cardStroke: 'rgba(15, 118, 110, 0.10)',
    cardHighlight: 'rgba(255, 255, 255, 0.9)',
    ambientPrimary: 'rgba(14, 165, 233, 0.12)',
    ambientSecondary: 'rgba(15, 118, 110, 0.10)',

    // Mood colors (for mood picker)
    moodHappy: '#FBBF24',
    moodCalm: '#38BDF8',
    moodSad: '#64748B',
    moodAnxious: '#FDBA74',
    moodEnergetic: '#F97316',
    moodNeutral: '#94A3B8',

    // Legacy compatibility
    tint: '#0F766E',
    icon: '#4B635F',
    tabIconDefault: '#80928E',
    tabIconSelected: '#0F766E',
  },
  spacing,
  radius,
  elevation,
};

// Dark gradients - deeper, more saturated
const darkGradients = {
  gradientPrimary: ['#14B8A6', '#38BDF8'] as const,
  gradientSecondary: ['#F97316', '#F59E0B'] as const,
  gradientAccent: ['#22C55E', '#2DD4BF'] as const,

  gradientHappy: ['#FBBF24', '#F59E0B'] as const,
  gradientCalm: ['#38BDF8', '#0EA5E9'] as const,
  gradientSad: ['#64748B', '#155E75'] as const,
  gradientAnxious: ['#FB923C', '#FB7185'] as const,
  gradientEnergetic: ['#F97316', '#EF4444'] as const,

  cardGradient1: ['#132A28', '#0D1D1B'] as const,
  cardGradient2: ['#0D2430', '#0A1A22'] as const,
  cardGradient3: ['#122A1B', '#0D1D13'] as const,
  cardGradient4: ['#2A1E12', '#1F160D'] as const,
  cardGradient5: ['#2A1B14', '#1F140F'] as const,
  cardGradient6: ['#1B2528', '#12191C'] as const,

  glass: ['rgba(30,30,30,0.8)', 'rgba(30,30,30,0.6)'] as const,
  glassSubtle: ['rgba(30,30,30,0.4)', 'rgba(30,30,30,0.2)'] as const,
  canvasGradient: ['#081514', '#10211F'] as const,
  heroGradient: ['#14B8A6', '#0EA5E9'] as const,
};

// Dark theme - Rich, immersive, reduces eye strain
export const darkTheme = {
  mode: 'dark' as const,
  colors: {
    // Brand colors - slightly brighter for dark mode
    primary: '#2DD4BF', // Bright teal
    primaryLight: '#99F6E4',
    primaryDark: '#14B8A6',
    secondary: '#FB923C', // Warm orange
    secondaryLight: '#FDBA74',
    accent: '#38BDF8', // Brighter blue
    accentLight: '#7DD3FC',

    // Semantic colors - softened for dark mode
    success: '#4ADE80',
    successLight: '#14532D',
    warning: '#FBBF24',
    warningLight: '#451A03',
    error: '#F87171',
    errorLight: '#450A0A',
    info: '#7DD3FC',
    infoLight: '#0C4A6E',

    // Dark neutrals
    background: '#071312', // Deep teal-black
    background2: '#0D1D1B', // Elevated bg
    surface: '#102120', // Card surfaces
    surface2: '#132826', // Elevated surface
    surfaceGlass: 'rgba(16, 33, 32, 0.82)', // Glassmorphism

    // Text hierarchy - high contrast
    text: '#F3FCFA', // Near white
    text2: '#A7C1BC', // Secondary
    text3: '#6E8782', // Tertiary
    textInverse: '#102120', // Dark text on light

    // Interactive elements
    border: '#1F3936',
    border2: '#2D4B47',
    borderFocus: '#5EEAD4',
    placeholder: '#64807A',
    input: '#122826',
    inputFocus: '#10312C',

    // States
    disabled: '#35514C',
    disabledText: '#64807A',
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.36)',

    // Special
    white: '#FFFFFF',
    black: '#000000',

    // Gradients
    ...darkGradients,

    // Visual system helpers
    cardStroke: 'rgba(94, 234, 212, 0.12)',
    cardHighlight: 'rgba(255, 255, 255, 0.08)',
    ambientPrimary: 'rgba(56, 189, 248, 0.12)',
    ambientSecondary: 'rgba(45, 212, 191, 0.10)',

    // Mood colors
    moodHappy: '#FBBF24',
    moodCalm: '#38BDF8',
    moodSad: '#64748B',
    moodAnxious: '#FB923C',
    moodEnergetic: '#F97316',
    moodNeutral: '#6E8782',

    // Legacy compatibility
    tint: '#2DD4BF',
    icon: '#A7C1BC',
    tabIconDefault: '#64807A',
    tabIconSelected: '#2DD4BF',
  },
  spacing,
  radius,
  elevation,
};

// Export for backward compatibility with existing code
export const Colors = {
  light: lightTheme.colors,
  dark: darkTheme.colors,
};

// Font configuration - 2026 prefers system fonts for performance
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', system-ui, sans-serif",
    mono: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
});

/** Typography scale — 2026 modern scale with better hierarchy */
export const font = {
  // Display - for hero sections
  display: 40,
  displaySmall: 36,

  // Headings
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,

  // Body
  body: 16,
  bodyLarge: 18,
  bodySmall: 14,

  // UI elements
  label: 14,
  labelSmall: 12,
  caption: 12,
  captionSmall: 10,
  button: 16,
  buttonSmall: 14,

  // Line heights (multipliers)
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,
} as const;

/** Font weights - semantic naming */
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

/** Animation tokens — 2026 micro-interactions */
export const animation = {
  // Durations
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  staggerDelay: 50,
  entranceDuration: 400,

  // Scales
  microInteractionScale: 0.97,
  pressScale: 0.95,
  hoverScale: 1.02,

  // Spring configs
  springConfig: { damping: 20, stiffness: 300, mass: 0.8 },
  springBouncy: { damping: 12, stiffness: 200, mass: 0.8 },
  springStiff: { damping: 25, stiffness: 400, mass: 0.6 },
  springGentle: { damping: 30, stiffness: 150, mass: 1 },

  // Easing presets (for non-spring animations)
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeIn: 'cubic-bezier(0.7, 0, 0.84, 0)',
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

/** Layout tokens — responsive design */
export const layout = {
  maxContentWidth: 600,
  maxContentWidthWide: 800,
  cardMinHeight: 100,
  cardMinHeightLarge: 140,
  gridGap: 12,
  gridGapLarge: 16,
  touchTargetMin: 44,
  touchTargetComfortable: 48,
  headerHeight: 56,
  tabBarHeight: 64,
  bottomSheetRadius: 24,
} as const;

/** Glassmorphism helper */
export const glassmorphism = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dark: {
    backgroundColor: 'rgba(31, 31, 35, 0.7)',
    backdropFilter: 'blur(20px)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
} as const;
