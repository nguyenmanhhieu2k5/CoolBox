import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface LayoutInfo {
  width: number;
  height: number;
  /** phone-sized */
  compact: boolean;
  /** wide windows (tablet landscape / desktop): Home switches to a two-column hero */
  wide: boolean;
  /** width of the app column; phone = full width, larger screens are capped */
  columnWidth: number;
  insets: { top: number; bottom: number };
  /** Rendered width for the hero fridge on Home */
  homeFridgeWidth: number;
  /** Rendered width for the hero fridge on Splash */
  splashFridgeWidth: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * One place for responsive decisions. Phones use the full width; tablets and
 * desktop keep a comfortable column instead of stretching, and Home becomes a
 * two-column layout when there is room for it.
 */
export function useLayout(): LayoutInfo {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const wide = width >= 900 && height >= 560;
  const compact = width < 600;
  const columnWidth = wide ? Math.min(width, 1080) : compact ? width : Math.min(width, 560);

  const topInset = Math.max(insets.top, 12);
  const bottomInset = Math.max(insets.bottom, 10);

  // Fridge sizing: bounded by both the width and the vertical room available.
  const fridgeRatio = 440 / 280;
  const homeFridgeWidth = wide
    ? clamp((height - 300) / fridgeRatio, 260, 420)
    : clamp(Math.min(columnWidth * 0.56, (height * 0.4) / fridgeRatio), 150, 300);

  const splashFridgeWidth = clamp(Math.min(columnWidth * 0.7, (height * 0.5) / fridgeRatio), 170, 380);

  return {
    width,
    height,
    compact,
    wide,
    columnWidth,
    insets: { top: topInset, bottom: bottomInset },
    homeFridgeWidth,
    splashFridgeWidth,
  };
}
