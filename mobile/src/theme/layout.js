import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
export const IS_WEB = Platform.OS === 'web';
export const APP_MAX_WIDTH = 430;

export const CONTENT_WIDTH = IS_WEB ? Math.min(width, APP_MAX_WIDTH) : width;

export const isSmallPhone = (value = width) => value < 380;
export const isMediumPhone = (value = width) => value >= 380 && value < 430;
export const isLargePhone = (value = width) => value >= 430;

export const horizontalPaddingFor = (value = width) => {
  if (isSmallPhone(value)) return 16;
  if (isLargePhone(value)) return 22;
  return 20;
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
};

export const font = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 20,
  xl: 26,
  title: 30,
};

export const bottomTabHeight = 82;
export const horizontalPadding = 20;
export const bottomSafePadding = Platform.OS === 'android' ? 18 : 12;
