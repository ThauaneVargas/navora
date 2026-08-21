export const lightColors = {
  primary: '#B00018',
  primaryDark: '#7A0012',
  background: '#FFFFFF',
  backgroundSoft: '#FFF7F8',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF7F8',
  text: '#111116',
  muted: '#666873',
  border: '#EFE2E5',
  iconBg: '#FFF1F3',
  shadow: 'rgba(117, 0, 18, 0.12)',
  danger: '#C4001A',
  success: '#1FA35B',
  bg: '#FFFFFF',
  bgSoft: '#FFF7F8',
  surfaceSoft: '#FFF7F8',
  primarySoft: '#FFF1F3',
  primaryDeep: '#3A050B',
  accent: '#D00016',
  lightText: '#A0A0A7',
  borderStrong: '#E7CED3',
  warning: '#F6A400',
  blue: '#2F80ED',
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

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 5
  },
  soft: {
    shadowColor: '#B40012',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 4
  }
};
