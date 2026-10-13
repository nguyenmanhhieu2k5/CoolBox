import React, { memo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { CAVITY, DOOR, HINGE_X, VB_H, VB_W } from './geometry';
import { FridgeGroundShadow } from './FridgeGroundShadow';
import { FridgeBody } from './FridgeBody';
import { FridgeInterior } from './FridgeInterior';
import { FridgeDoor } from './FridgeDoor';
import { useUid } from './useUid';
import type { AnimValue } from './animTypes';
import { Motion } from '../../motion';

export interface CoolBoxFridgeProps {
  /** Rendered width in px. Height follows the fixed product proportions. */
  width: number;
  /** Door angle in degrees (0 closed .. ~100 open). Drive this with Reanimated. */
  door?: AnimValue;
  /** 0..1 — display brightness + cool ambient glow ("wake"). */
  activation?: AnimValue;
  /** Text on the display, e.g. "10°". */
  label?: string;
  /** Snowflake on the display is lit while cooling. */
  cooling?: boolean;
  /** 0..1 — cold blue lighting mood (0 neutral idle, 1 actively cooling). */
  cold?: AnimValue;
  /** 0..1 — cooling has settled at target: rings calm down, light turns soft and stable. */
  calm?: AnimValue;
  /** 0..1 one-shot — "target reached" ripple. */
  pulse?: AnimValue;
  /** 0..1 — latch release: the handle draws out a hair. */
  lock?: AnimValue;
  /** 0..1 — a band of light travelling across the door (waking up). */
  sweep?: AnimValue;
  /** 0..1 — camera dolly progress. Layers counter-scale by their depth to create parallax. */
  camera?: AnimValue;
  /** false → the status LED turns amber and pulses (connecting / offline). */
  online?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Interior light follows the door: 0% closed, ~20–60% partly open, 100% fully open. */
function lightFromDoor(angle: number) {
  'worklet';
  return interpolate(angle, [0, 3, 14, 30, 60, 90], [0, 0.07, 0.3, 0.5, 0.82, 1], Extrapolation.CLAMP);
}

const INTERIOR_OVERSCAN = 1.06;

/**
 * The single CoolBox refrigerator used on Splash, Home and the device screens.
 *
 * Depth layers (back → front), each with its own parallax rate during the camera dolly:
 *   ambient halo (10%) · floor glow, rings & shadows (20%) · body · interior (≈70%)
 *   · interior light (45%) · door (+handle, display) · light spill (110%)
 *
 * Body and door are independent; only the door ever moves.
 */
export const CoolBoxFridge = memo(function CoolBoxFridge({
  width,
  door,
  activation,
  label = '10°',
  cooling = true,
  cold,
  calm,
  pulse,
  lock,
  sweep,
  camera,
  online = true,
  style,
}: CoolBoxFridgeProps) {
  const s = width / VB_W;
  const height = VB_H * s;
  const uid = useUid('cf');
  const ox = (CAVITY.x + CAVITY.w / 2) * s;
  const oy = (CAVITY.y + CAVITY.h / 2) * s;
  const origin = `${ox}px ${oy}px`;

  const fbDoor = useSharedValue(0);
  const fbAct = useSharedValue(0.6);
  const fbCold = useSharedValue(1);
  const fbZero = useSharedValue(0);
  const doorV = door ?? fbDoor;
  const activationV = activation ?? fbAct;
  const coldV = cold ?? fbCold;
  const calmV = calm ?? fbZero;
  const pulseV = pulse ?? fbZero;
  const lockV = lock ?? fbZero;
  const sweepV = sweep ?? fbZero;
  const camV = camera ?? fbZero;

  const light = useDerivedValue(() => lightFromDoor(doorV.value));
  const floorGlow = useDerivedValue(() =>
    Math.min(1, activationV.value * (0.45 + 0.4 * coldV.value) + light.value * 0.55),
  );

  /** counter-scale so a layer follows the camera at `k` of the full dolly rate */
  const parallax = (k: number) => {
    'worklet';
    return Math.pow(Motion.camera.maxZoom, camV.value * (k - 1));
  };

  const ambientStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(activationV.value + light.value, [0, 1, 2], [0, 0.5, 1], Extrapolation.CLAMP) *
      (0.5 + 0.5 * coldV.value) *
      (1 - camV.value * 0.5),
    transform: [{ scale: parallax(Motion.camera.parallax.background) }],
  }));
  const floorLayer = useAnimatedStyle(() => ({
    opacity: 1 - interpolate(camV.value, [0.35, 0.9], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: parallax(Motion.camera.parallax.floor) }],
  }));
  const interiorLayer = useAnimatedStyle(() => ({
    transform: [{ scale: INTERIOR_OVERSCAN - (INTERIOR_OVERSCAN - 1) * camV.value }],
  }));
  const glowLayer = useAnimatedStyle(() => ({
    opacity: light.value * (0.55 + 0.3 * camV.value),
    transform: [{ scale: parallax(Motion.camera.parallax.interiorLight) }],
  }));

  // The open door throws a shadow across the interior, strongest mid-swing, gone once it clears.
  const doorShadow = useAnimatedStyle(() => {
    const a = (doorV.value * Math.PI) / 180;
    const open = interpolate(doorV.value, [55, 95], [1, 0], Extrapolation.CLAMP);
    return { opacity: Math.max(0, Math.sin(a)) * 0.55 * open + 0.0 };
  });

  // Light leaking out along the door's free edge: appears at the first few degrees.
  const spillStyle = useAnimatedStyle(() => {
    const a = (Math.max(0, doorV.value) * Math.PI) / 180;
    const edgeX = (HINGE_X - DOOR.w * Math.cos(a)) * s;
    const grow = interpolate(doorV.value, [1, 10, 40, 90], [0, 0.55, 1, 0.7], Extrapolation.CLAMP);
    return {
      opacity: grow * (0.4 + 0.6 * light.value),
      transform: [{ translateX: edgeX - 26 * s }, { scaleX: 0.45 + 0.9 * grow }],
    };
  });

  return (
    <View style={[{ width, height }, style]}>
      {/* background layer: slowest */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transformOrigin: origin }, ambientStyle]}>
        <View
          style={{ position: 'absolute', left: -0.45 * width, top: -0.12 * height, width: width * 1.9, height: height * 1.24 }}
        >
          <Svg width={width * 1.9} height={height * 1.24} viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <RadialGradient id={`${uid}amb`} cx="50%" cy="52%" r="50%">
                <Stop offset="0" stopColor="#72C8FF" stopOpacity="0.38" />
                <Stop offset="0.55" stopColor="#72C8FF" stopOpacity="0.1" />
                <Stop offset="1" stopColor="#72C8FF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={100} height={100} fill={`url(#${uid}amb)`} />
          </Svg>
        </View>
      </Animated.View>

      {/* floor: glow, cooling rings, physical + door shadow */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transformOrigin: origin }, floorLayer]}>
        <FridgeGroundShadow width={width} glow={floorGlow} door={doorV} cold={coldV} calm={calmV} pulse={pulseV} />
      </Animated.View>

      <FridgeBody width={width} />

      {/* cavity window: interior + interior light + the door's cast shadow, all clipped to the opening */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: CAVITY.x * s,
          top: CAVITY.y * s,
          width: CAVITY.w * s,
          height: CAVITY.h * s,
          borderRadius: CAVITY.r * s,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            { position: 'absolute', left: -CAVITY.x * s, top: -CAVITY.y * s, width, height, transformOrigin: origin },
            interiorLayer,
          ]}
        >
          <FridgeInterior width={width} light={light} />
        </Animated.View>

        <Animated.View
          style={[
            { position: 'absolute', left: -CAVITY.x * s, top: -CAVITY.y * s, width, height, transformOrigin: origin },
            glowLayer,
          ]}
        >
          <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
            <Defs>
              <RadialGradient id={`${uid}ig`} cx="50%" cy="12%" r="55%">
                <Stop offset="0" stopColor="#EAF7FF" stopOpacity="0.55" />
                <Stop offset="0.6" stopColor="#BFE3FF" stopOpacity="0.12" />
                <Stop offset="1" stopColor="#BFE3FF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x={CAVITY.x} y={CAVITY.y} width={CAVITY.w} height={CAVITY.h} fill={`url(#${uid}ig)`} />
          </Svg>
        </Animated.View>

        <Animated.View
          style={[{ position: 'absolute', right: 0, top: 0, bottom: 0, width: CAVITY.w * s * 0.55 }, doorShadow]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id={`${uid}ds`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#020611" stopOpacity="0" />
                <Stop offset="1" stopColor="#020611" stopOpacity="0.8" />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={100} height={100} fill={`url(#${uid}ds)`} />
          </Svg>
        </Animated.View>
      </View>

      <FridgeDoor
        scale={s}
        angle={doorV}
        activation={activationV}
        label={label}
        cooling={cooling}
        lock={lockV}
        sweep={sweepV}
        online={online}
      />

      {/* nearest layer: rim light leaking from the door gap */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: 0, top: (DOOR.y + 10) * s, width: 52 * s, height: (DOOR.h - 20) * s },
          spillStyle,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={`${uid}sp`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#CFEAFF" stopOpacity="0" />
              <Stop offset="0.5" stopColor="#EAF7FF" stopOpacity="0.55" />
              <Stop offset="1" stopColor="#CFEAFF" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id={`${uid}spv`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#fff" stopOpacity="0" />
              <Stop offset="0.5" stopColor="#fff" stopOpacity="1" />
              <Stop offset="1" stopColor="#fff" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={100} fill={`url(#${uid}sp)`} />
        </Svg>
      </Animated.View>
    </View>
  );
});
