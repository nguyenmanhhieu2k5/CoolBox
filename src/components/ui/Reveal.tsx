import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import type { AnimValue } from '../fridge/animTypes';
import { easeOutBack, easeOutCubic } from '../../motion';

interface Props {
  /** 0..1 master progress (e.g. Home intro). */
  progress: AnimValue;
  /** Window of `progress` in which this element animates in. */
  from: number;
  to: number;
  /** Rise distance in px (small — this is only a supporting layer). */
  rise?: number;
  /**
   * Depth: elements "near the camera" arrive larger and settle down (>1);
   * far ones arrive slightly small and settle up (<1). Default is a gentle 0.97.
   */
  depth?: number;
  /** Let the element settle with a small overshoot instead of a plain decelerate. */
  settle?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** Layered entrance driven by one master value: opacity + depth-scale + a short settle. */
export function Reveal({ progress, from, to, rise = 10, depth = 0.97, settle = false, style, children }: Props) {
  const animated = useAnimatedStyle(() => {
    const t = interpolate(progress.value, [from, to], [0, 1], 'clamp');
    const p = settle ? easeOutBack(t, 1.1) : easeOutCubic(t);
    return {
      opacity: Math.min(1, t * 1.6),
      transform: [{ translateY: (1 - p) * rise }, { scale: depth + (1 - depth) * p }],
    };
  });
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
