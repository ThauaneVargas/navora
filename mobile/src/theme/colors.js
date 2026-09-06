export const lightColors = {
  primary: '#7A1021',
  primaryDark: '#4E0712',
  background: '#F7F8FA',
  backgroundSoft: '#EEF1F4',
  surface: '#FFFFFF',
  surfaceAlt: '#FAF6F7',
  text: '#171417',
  textSecondary: '#6D6870',
  muted: '#6D6870',
  border: '#E8E3E5',
  iconBg: '#F5E8EB',
  shadow: 'rgba(57, 31, 35, 0.10)',
  danger: '#B42332',
  success: '#168A4A',
  warning: '#B7791F',
  bg: '#F7F8FA',
  bgSoft: '#EEF1F4',
  surfaceSoft: '#FAF6F7',
  primarySoft: '#F5E8EB',
  primaryDeep: '#2D070D',
  accent: '#9E1B32',
  lightText: '#9B949B',
  borderStrong: '#D9C8CD',
  blue: '#2768B7',
  dark: '#0D0E14',
  darkCard: '#171922',
  overlay: 'rgba(23, 20, 23, 0.48)',
  attention: '#B7791F',
};

export const darkColors = {
  primary: '#FF6B7F',
  primaryDark: '#FF4B63',
  background: '#101014',
  backgroundSoft: '#15151B',
  surface: '#1A1A21',
  surfaceAlt: '#241A1D',
  text: '#FFFFFF',
  muted: '#C6C6CF',
  border: '#30303A',
  iconBg: '#331D23',
  shadow: 'rgba(0, 0, 0, 0.35)',
  danger: '#FF4B63',
  success: '#35D07F',
  bg: '#101014',
  bgSoft: '#15151B',
  surfaceSoft: '#241A1D',
  primarySoft: '#331D23',
  primaryDeep: '#FFE2E7',
  accent: '#FF4B63',
  lightText: '#8D8D98',
  borderStrong: '#3A3A44',
  warning: '#F6B93B',
  blue: '#6EA8FF',
  dark: '#101014',
  darkCard: '#1A1A21',
  overlay: 'rgba(0, 0, 0, 0.58)',
  attention: '#F6B93B',
};

export const colors = lightColors;

export const getColors = (isDark = false) => (isDark ? darkColors : lightColors);

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  jumbo: 40,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const typography = {
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  body: { fontSize: 14, lineHeight: 21, fontWeight: '500' },
  bodyMedium: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
  subtitle: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  headline: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
};

export const buttons = {
  height: 56,
  minTouch: 44,
  radius: 18,
  smallHeight: 48,
};

export const states = {
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.58,
  },
};

export const shadows = {
  card: {
    shadowColor: '#2D070D',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 2
  },
  soft: {
    shadowColor: '#4E0712',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 2
  }
};
