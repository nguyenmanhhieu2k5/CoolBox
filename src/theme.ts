import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  primary: '#1478FF',
  ice: '#72C8FF',
  text: '#111318',
  secondary: '#737C8C',
  border: '#E6EAF0',
  success: '#34C759',
  danger: '#FF5A52',
  warning: '#FF9F0A',
  // Tints derived from the brand blue
  primarySoft: '#E8F1FF',
  iceSoft: '#EAF6FF',
};

export const radius = { sm: 12, md: 18, lg: 24, xl: 32, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}) as string;

export const type = {
  hero: { fontFamily, fontSize: 76, fontWeight: '200', letterSpacing: -3, color: colors.text } as TextStyle,
  title: { fontFamily, fontSize: 28, fontWeight: '700', letterSpacing: -0.6, color: colors.text } as TextStyle,
  heading: { fontFamily, fontSize: 18, fontWeight: '600', letterSpacing: -0.2, color: colors.text } as TextStyle,
  body: { fontFamily, fontSize: 15, fontWeight: '500', color: colors.text } as TextStyle,
  caption: { fontFamily, fontSize: 13, fontWeight: '500', color: colors.secondary } as TextStyle,
  micro: { fontFamily, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, color: colors.secondary } as TextStyle,
};

export const shadow = {
  soft: Platform.select({
    web: { boxShadow: '0 8px 28px rgba(20, 40, 80, 0.07)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#14285A',
      shadowOpacity: 0.07,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    } as ViewStyle,
  }) as ViewStyle,
  lift: Platform.select({
    web: { boxShadow: '0 14px 40px rgba(20, 80, 200, 0.18)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#1478FF',
      shadowOpacity: 0.22,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    } as ViewStyle,
  }) as ViewStyle,
};

/** @deprecated kept for older imports — use `Motion` from src/motion. */
export const motion = {
  spring: { damping: 18, stiffness: 190, mass: 0.9 },
  springSoft: { damping: 22, stiffness: 140, mass: 1 },
  fast: 180,
  base: 320,
  slow: 520,
};
