export const lightColors = {
  primary: '#7A1021',
  primaryDark: '#4E0712',
  background: '#FBF8F5',
  backgroundSoft: '#F6F0EC',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F2EE',
  text: '#171417',
  textSecondary: '#6D6870',
  muted: '#6D6870',
  border: '#E9DEDA',
  iconBg: '#F4E9E8',
  shadow: 'rgba(57, 31, 35, 0.10)',
  danger: '#B42332',
  success: '#168A4A',
  warning: '#B7791F',
  bg: '#FBF8F5',
  bgSoft: '#F6F0EC',
  surfaceSoft: '#F7F2EE',
  primarySoft: '#F4E7E8',
  primaryDeep: '#2D070D',
  accent: '#9E1B32',
  lightText: '#9B949B',
  borderStrong: '#D8C6C2',
  blue: '#2768B7',
  dark: '#0D0E14',
  darkCard: '#171922'
};

export const darkColors = {
  primary: '#FF4B63',
  primaryDark: '#B00018',
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
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
};

export const typography = {
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 21, fontWeight: '500' },
  bodyMedium: { fontSize: 14, lineHeight: 21, fontWeight: '700' },
  subtitle: { fontSize: 16, lineHeight: 23, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  headline: { fontSize: 30, lineHeight: 36, fontWeight: '800' },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 2
  },
  soft: {
    shadowColor: '#4E0712',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 2
  }
};
