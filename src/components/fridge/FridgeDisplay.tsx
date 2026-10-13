import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Snowflake } from 'lucide-react-native';
import { useEffect } from 'react';
import { DISPLAY } from './geometry';
import { useUid } from './useUid';
import type { AnimValue } from './animTypes';

interface Props {
  scale: number;
  /** text shown, e.g. "10°" */
  label: string;
  /** 0..1 — display brightness / glow */
  activation: AnimValue;
  /** hide the snowflake when cooling is off */
  cooling?: boolean;
  /** status LED: blue when connected, amber + pulsing while offline / connecting */
  online?: boolean;
}

/** Small physical black display: rounded, dark gradient, inner shadow, blue glow. */
export const FridgeDisplay = memo(function FridgeDisplay({ scale: s, label, activation, cooling = true, online = true }: Props) {
  const uid = useUid('dp');
  const { x, y, w, h, r } = DISPLAY;

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(activation.value, [0, 1], [0.22, 1]),
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(activation.value, [0, 1], [0.45, 1]),
    transform: [{ scale: interpolate(activation.value, [0, 1], [0.97, 1]) }],
  }));
  // status LED: fades in as the display wakes; amber heartbeat while the link is down
  const beat = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(beat);
    if (online) beat.value = withTiming(0, { duration: 300 });
    else beat.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [online]);
  const ledStyle = useAnimatedStyle(() => ({
    opacity: interpolate(activation.value, [0.2, 0.9], [0, 1], 'clamp') * (online ? 1 : 0.35 + beat.value * 0.65),
    backgroundColor: online ? '#58BBFF' : '#FFB020',
    transform: [{ scale: online ? 1 : 0.9 + beat.value * 0.25 }],
  }));

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: x * s, top: y * s, width: w * s, height: h * s }}
    >
      {/* blue halo bleeding past the bezel */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: -26 * s,
            top: -22 * s,
            width: (w + 52) * s,
            height: (h + 44) * s,
          },
          glowStyle,
        ]}
      >
        <Svg width={(w + 52) * s} height={(h + 44) * s} viewBox={`0 0 ${w + 52} ${h + 44}`}>
          <Defs>
            <RadialGradient id={`${uid}halo`} cx="50%" cy="50%" r="50%">
              <Stop offset="0.35" stopColor="#4CB4FF" stopOpacity="0.17" />
              <Stop offset="1" stopColor="#4CB4FF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={w + 52} height={h + 44} fill={`url(#${uid}halo)`} />
        </Svg>
      </Animated.View>

      <Svg width={w * s} height={h * s} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id={`${uid}bg`} x1="0" y1="0" x2="0.4" y2="1">
            <Stop offset="0" stopColor="#10141B" />
            <Stop offset="1" stopColor="#05070A" />
          </LinearGradient>
          <LinearGradient id={`${uid}inTop`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity="0.7" />
            <Stop offset="0.2" stopColor="#000" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id={`${uid}ring`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity="0.28" />
            <Stop offset="0.5" stopColor="#fff" stopOpacity="0.04" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0.12" />
          </LinearGradient>
          <LinearGradient id={`${uid}glass`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity="0.1" />
            <Stop offset="0.4" stopColor="#fff" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} rx={r} fill={`url(#${uid}bg)`} />
        <Rect x={0} y={0} width={w} height={h} rx={r} fill={`url(#${uid}inTop)`} />
        <Rect x={0} y={0} width={w} height={h} rx={r} fill={`url(#${uid}glass)`} />
        <Rect
          x={0.5}
          y={0.5}
          width={w - 1}
          height={h - 1}
          rx={r - 0.5}
          fill="none"
          stroke={`url(#${uid}ring)`}
          strokeWidth={1}
        />
      </Svg>

      <Animated.View
        style={[
          { position: 'absolute', top: 8 * s, right: 8 * s, width: 4.5 * s, height: 4.5 * s, borderRadius: 3 * s },
          ledStyle,
        ]}
      />

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { alignItems: 'center', justifyContent: 'center', paddingTop: 2 * s },
          contentStyle,
        ]}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 22 * s,
            lineHeight: 26 * s,
            fontWeight: '500',
            letterSpacing: -0.5,
            fontVariant: ['tabular-nums'],
          }}
        >
          {label}
        </Text>
        <View style={{ height: 14 * s }} />
        <View
          style={{
            opacity: cooling ? 1 : 0.35,
            ...(cooling
              ? ({
                  shadowColor: '#4CB4FF',
                  shadowOpacity: 0.9,
                  shadowRadius: 8 * s,
                  shadowOffset: { width: 0, height: 0 },
                } as const)
              : null),
          }}
        >
          <Snowflake size={22 * s} color="#4DB6FF" strokeWidth={2.2} />
        </View>
      </Animated.View>
    </View>
  );
});
