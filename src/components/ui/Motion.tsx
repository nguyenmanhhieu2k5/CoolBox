import React, { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Fan, Snowflake } from 'lucide-react-native';
import { Motion } from '../../motion';

/**
 * Fan with real inertia. Angular velocity is the animated quantity; rotation is
 * integrated every frame on the UI thread. Turning on spins up slowly, turning
 * off coasts down — the blades never snap between "stopped" and "spinning".
 */
export function SpinningFan({ on, speed, size = 24, color }: { on: boolean; speed: number; size?: number; color: string }) {
  const rot = useSharedValue(0);
  const omega = useSharedValue(0); // deg / s
  const running = useSharedValue(false);

  const frame = useFrameCallback((info) => {
    'worklet';
    const dt = info.timeSincePreviousFrame ?? 16;
    rot.value = (rot.value + (omega.value * dt) / 1000) % 360;
  }, false);

  useEffect(() => {
    const target = on ? (Math.max(0, speed) / 100) * Motion.physics.fanMaxDegPerSec : 0;
    if (target > 0) {
      frame.setActive(true);
      running.value = true;
      omega.value = withTiming(target, { duration: Motion.physics.fanSpinUpMs, easing: Easing.out(Easing.quad) });
    } else {
      omega.value = withTiming(0, { duration: Motion.physics.fanSpinDownMs, easing: Easing.out(Easing.cubic) }, (done) => {
        if (done) runOnJS(frame.setActive)(false);
      });
    }
  }, [on, Math.round(speed / 10)]);

  useEffect(() => () => frame.setActive(false), []);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return (
    <Animated.View style={style}>
      <Fan size={size} color={color} strokeWidth={2} />
    </Animated.View>
  );
}

/**
 * Snowflake breathing with the cooling state:
 *  - cooling      steady pulse
 *  - approaching  softer, slower pulse
 *  - reached      stable (calm), a single settle
 */
export function PulsingSnow({ on, calm = false, size = 24, color }: { on: boolean; calm?: boolean; size?: number; color: string }) {
  const p = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(p);
    if (on && !calm) {
      p.value = withRepeat(
        withSequence(
          withTiming(1.16, { duration: Motion.light.pulseMs / 2, easing: Motion.easing.breathe }),
          withTiming(0.96, { duration: Motion.light.pulseMs / 2, easing: Motion.easing.breathe }),
        ),
        -1,
        true,
      );
    } else {
      p.value = withTiming(1, { duration: Motion.duration.product, easing: Motion.easing.ui });
    }
  }, [on, calm]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: p.value }], opacity: on && !calm ? 0.8 + (p.value - 0.96) * 1.2 : 1 }));
  return (
    <Animated.View style={style}>
      <Snowflake size={size} color={color} strokeWidth={2} />
    </Animated.View>
  );
}
