import React, { memo, useEffect } from 'react';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { HINGE_X, VB_H, VB_W } from './geometry';
import { useUid } from './useUid';
import type { AnimValue } from './animTypes';

interface Props {
  width: number;
  /** 0..1 — cool floor glow intensity */
  glow: AnimValue;
  /** door angle (deg): the door throws a moving shadow on the floor */
  door: AnimValue;
  /** 0..1 cold mood */
  cold: AnimValue;
  /** 0..1 calm (target reached) */
  calm: AnimValue;
  /** 0..1 one-shot success ripple */
  pulse: AnimValue;
}

const RING_W = 330;
const RING_H = 64;
const CX = 142;
const CY = 414;

/** One expanding ring on the floor. Cooling = steady emission, calm = almost still. */
function CoolingRing({ s, delay, cold, calm }: { s: number; delay: number; cold: AnimValue; calm: AnimValue }) {
  const t = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(t);
    t.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.out(Easing.quad) }), -1, false);
  }, []);
  const style = useAnimatedStyle(() => {
    const p = (t.value + delay) % 1;
    const strength = cold.value * (1 - calm.value * 0.82);
    return {
      opacity: (1 - p) * 0.55 * strength * interpolate(p, [0, 0.12], [0, 1], 'clamp'),
      transform: [{ scale: 0.72 + p * 0.5 }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: (CX - RING_W / 2) * s, top: (CY - RING_H / 2 + 4) * s, width: RING_W * s, height: RING_H * s },
        style,
      ]}
    >
      <Svg width={RING_W * s} height={RING_H * s} viewBox={`0 0 ${RING_W} ${RING_H}`}>
        <Ellipse cx={RING_W / 2} cy={RING_H / 2} rx={RING_W / 2 - 3} ry={RING_H / 2 - 3} fill="none" stroke="#72C8FF" strokeWidth={1.4} />
      </Svg>
    </Animated.View>
  );
}

/**
 * Soft ground shadow, contact shadows under the feet, the cool floor glow, the
 * emitted cooling rings, a success ripple and the moving shadow of the open door.
 */
export const FridgeGroundShadow = memo(function FridgeGroundShadow({ width, glow, door, cold, calm, pulse }: Props) {
  const s = width / VB_W;
  const uid = useUid('gs');
  const style = useAnimatedStyle(() => ({ opacity: 0.3 + glow.value * 0.7 }));

  // Door shadow on the floor: grows as the door swings out, slides with it, fades when it parks.
  const doorShadow = useAnimatedStyle(() => {
    const a = (Math.max(0, door.value) * Math.PI) / 180;
    return {
      opacity: Math.sin(a) * 0.5,
      transform: [{ translateX: (HINGE_X - 20 + Math.sin(a) * 34) * s }, { scaleX: 0.25 + Math.sin(a) * 0.9 }],
    };
  });
  const ripple = useAnimatedStyle(() => ({
    opacity: Math.sin(Math.min(1, pulse.value) * Math.PI) * 0.7,
    transform: [{ scale: 0.7 + pulse.value * 0.7 }],
  }));

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { left: -60 * s, right: -60 * s, width: width + 120 * s, height: VB_H * s + 80 * s },
          style,
        ]}
      >
        <Svg width={width + 120 * s} height={VB_H * s + 80 * s} viewBox={`-60 -20 ${VB_W + 120} ${VB_H + 80}`}>
          <Defs>
            <RadialGradient id={`${uid}glow`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#72C8FF" stopOpacity="0.55" />
              <Stop offset="0.6" stopColor="#72C8FF" stopOpacity="0.16" />
              <Stop offset="1" stopColor="#72C8FF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={142} cy={410} rx={190} ry={44} fill={`url(#${uid}glow)`} />
          <Ellipse cx={142} cy={414} rx={150} ry={26} fill="none" stroke="#72C8FF" strokeOpacity={0.3} strokeWidth={1.2} />
          <Ellipse cx={142} cy={416} rx={176} ry={32} fill="none" stroke="#72C8FF" strokeOpacity={0.16} strokeWidth={1} />
        </Svg>
      </Animated.View>

      <CoolingRing s={s} delay={0} cold={cold} calm={calm} />
      <CoolingRing s={s} delay={0.5} cold={cold} calm={calm} />

      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: (CX - RING_W / 2) * s, top: (CY - RING_H / 2 + 4) * s, width: RING_W * s, height: RING_H * s },
          ripple,
        ]}
      >
        <Svg width={RING_W * s} height={RING_H * s} viewBox={`0 0 ${RING_W} ${RING_H}`}>
          <Ellipse cx={RING_W / 2} cy={RING_H / 2} rx={RING_W / 2 - 3} ry={RING_H / 2 - 3} fill="none" stroke="#72C8FF" strokeWidth={2.2} />
        </Svg>
      </Animated.View>

      {/* Physical shadows */}
      <Svg
        pointerEvents="none"
        width={width}
        height={VB_H * s}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient id={`${uid}ground`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#0A1424" stopOpacity="0.5" />
            <Stop offset="0.55" stopColor="#0A1424" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#0A1424" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`${uid}contact`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#000" stopOpacity="0.7" />
            <Stop offset="1" stopColor="#000" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={150} cy={414} rx={138} ry={17} fill={`url(#${uid}ground)`} />
        <Ellipse cx={50} cy={415} rx={26} ry={5} fill={`url(#${uid}contact)`} />
        <Ellipse cx={215} cy={417} rx={26} ry={5} fill={`url(#${uid}contact)`} />
        <Ellipse cx={258} cy={407} rx={14} ry={3.2} fill={`url(#${uid}contact)`} opacity={0.6} />
      </Svg>

      {/* the open door's shadow on the floor */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: 0, top: 404 * s, width: 70 * s, height: 22 * s },
          doorShadow,
        ]}
      >
        <Svg width={70 * s} height={22 * s} viewBox="0 0 70 22">
          <Defs>
            <RadialGradient id={`${uid}dsh`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#030712" stopOpacity="0.75" />
              <Stop offset="1" stopColor="#030712" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={35} cy={11} rx={34} ry={9} fill={`url(#${uid}dsh)`} />
        </Svg>
      </Animated.View>
    </>
  );
});
