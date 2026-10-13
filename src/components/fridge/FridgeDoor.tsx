import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import {
  CAMERA,
  DOOR,
  DOOR_FLIP_ANGLE,
  DOOR_THICKNESS,
  HANDLE,
  HINGE_X,
  PERSPECTIVE,
} from './geometry';
import { FridgeHandle } from './FridgeHandle';
import { FridgeDisplay } from './FridgeDisplay';
import { useUid } from './useUid';
import type { AnimValue } from './animTypes';

/** Vertical inset (design units) of the thickness strip, matching the door's corner radius. */
const CORNER_INSET = 17;

interface Props {
  scale: number;
  /** Door angle in degrees. 0 = closed, ~100 = fully open. */
  angle: AnimValue;
  /** 0..1 — display activation */
  activation: AnimValue;
  label: string;
  cooling?: boolean;
  /** 0..1 latch release: handle draws out slightly */
  lock: AnimValue;
  /** 0..1 band of light travelling across the face */
  sweep: AnimValue;
  online?: boolean;
}

/**
 * The door is a pivot assembly:
 *
 *   <Door plane>            rotates about the HINGE edge (right edge), never its center
 *     <Front face>          panel + handle (own layer, can be drawn out) + display + moving sheen
 *     <Back face>           inner liner, mirrored     (angle >= flip)
 *   <Door thickness edge>   the free edge, extruded behind the door
 *
 * Every non-coplanar piece gets its own transform built from the same hinge rotation and the
 * same camera (vanishing point), which keeps all pieces geometrically consistent on web/iOS/Android.
 */
export const FridgeDoor = memo(function FridgeDoor({
  scale: s,
  angle,
  activation,
  label,
  cooling = true,
  lock,
  sweep,
  online = true,
}: Props) {
  const uid = useUid('dr');
  const dw = DOOR.w * s;
  const dh = DOOR.h * s;
  const T = DOOR_THICKNESS * s;
  const D = PERSPECTIVE * s;
  const edgeH = (DOOR.h - CORNER_INSET * 2) * s;

  // Door plane center, strip center, camera and hinge (all in px, fridge-local)
  const ex = DOOR.x * s + dw / 2;
  const ey = DOOR.y * s + dh / 2;
  const cx = CAMERA.x * s;
  const cy = CAMERA.y * s;
  const hingeX = HINGE_X * s;

  const sx = DOOR.x * s + T / 2;

  const planeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cx - ex },
      { translateY: cy - ey },
      { perspective: D },
      { translateX: ex - cx },
      { translateY: ey - cy },
      { translateX: hingeX - ex },
      { rotateY: `${angle.value}deg` },
      { translateX: ex - hingeX },
    ],
  }));

  const edgeStyle = useAnimatedStyle(() => ({
    opacity: angle.value < 1.5 ? 0 : 1,
    transform: [
      { translateX: cx - sx },
      { translateY: cy - ey },
      { perspective: D },
      { translateX: sx - cx },
      { translateY: ey - cy },
      { translateX: hingeX - sx },
      { rotateY: `${angle.value}deg` },
      { translateX: sx - hingeX },
      // extrude the thickness behind the door's left edge
      { translateX: -T / 2 },
      { rotateY: '-90deg' },
      { translateX: T / 2 },
    ],
  }));

  const frontStyle = useAnimatedStyle(() => ({ opacity: angle.value < DOOR_FLIP_ANGLE ? 1 : 0 }));
  const backStyle = useAnimatedStyle(() => ({ opacity: angle.value < DOOR_FLIP_ANGLE ? 0 : 1 }));
  // The door darkens as it turns away from the light.
  const turnShade = useAnimatedStyle(() => ({
    opacity: interpolate(angle.value, [0, 45, DOOR_FLIP_ANGLE], [0, 0.1, 0.34], 'clamp'),
  }));

  // Latch release: the handle is drawn out a hair toward the viewer.
  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -1.6 * s * lock.value }, { scaleX: 1 + 0.14 * lock.value }],
  }));

  // Highlights that move with the door: a specular streak slides across as the angle changes…
  const streakStyle = useAnimatedStyle(() => ({
    opacity: interpolate(angle.value, [0, 8, 30, 70], [0, 0.7, 0.45, 0], 'clamp'),
    transform: [{ translateX: interpolate(angle.value, [0, 80], [-0.3 * dw, 0.85 * dw]) }, { skewX: '-14deg' }],
  }));
  // …and a one-off band of light crosses the face when the appliance wakes.
  const wakeStyle = useAnimatedStyle(() => ({
    opacity: Math.sin(Math.min(1, Math.max(0, sweep.value)) * Math.PI) * 0.9,
    transform: [{ translateX: -0.45 * dw + sweep.value * 1.5 * dw }, { skewX: '-14deg' }],
  }));

  return (
    <>
      {/* Thickness edge sits underneath the door plane */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: DOOR.x * s, top: (DOOR.y + CORNER_INSET) * s, width: T, height: edgeH },
          edgeStyle,
        ]}
      >
        {/* inset from the corners so the thickness follows the door's rounded outline */}
        <Svg width={T} height={edgeH} viewBox={`0 0 ${DOOR_THICKNESS} ${DOOR.h - CORNER_INSET * 2}`}>
          <Defs>
            <LinearGradient id={`${uid}edge`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#4B5260" />
              <Stop offset="0.45" stopColor="#2A2F39" />
              <Stop offset="1" stopColor="#14171D" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={DOOR_THICKNESS} height={DOOR.h - CORNER_INSET * 2} rx={6} fill={`url(#${uid}edge)`} />
          <Rect x={1.5} y={10} width={1.6} height={DOOR.h - CORNER_INSET * 2 - 20} rx={0.8} fill="#fff" opacity={0.25} />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[{ position: 'absolute', left: DOOR.x * s, top: DOOR.y * s, width: dw, height: dh }, planeStyle]}
      >
        {/* FRONT FACE */}
        <Animated.View style={[StyleSheet.absoluteFill, frontStyle]}>
          <Svg width={dw} height={dh} viewBox={`0 0 ${DOOR.w} ${DOOR.h}`}>
            <DoorFrontArt uid={uid} />
          </Svg>

          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, handleStyle, { transformOrigin: `${(HANDLE.x + HANDLE.w / 2) * s}px 50%` }]}>
            <Svg width={dw} height={dh} viewBox={`0 0 ${DOOR.w} ${DOOR.h}`}>
              <FridgeHandle uid={uid} />
            </Svg>
          </Animated.View>

          <FridgeDisplay scale={s} label={label} activation={activation} cooling={cooling} online={online} />

          {/* moving light, clipped to the rounded door face */}
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: DOOR.r * s, overflow: 'hidden' }]}>
            <Animated.View style={[{ position: 'absolute', left: 0, top: -dh * 0.1, width: dw * 0.34, height: dh * 1.2 }, streakStyle]}>
              <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id={`${uid}stk`} x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#fff" stopOpacity="0" />
                    <Stop offset="0.5" stopColor="#fff" stopOpacity="0.2" />
                    <Stop offset="1" stopColor="#fff" stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={100} height={100} fill={`url(#${uid}stk)`} />
              </Svg>
            </Animated.View>
            <Animated.View style={[{ position: 'absolute', left: 0, top: -dh * 0.1, width: dw * 0.22, height: dh * 1.2 }, wakeStyle]}>
              <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id={`${uid}wk`} x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#BFE3FF" stopOpacity="0" />
                    <Stop offset="0.5" stopColor="#CFEAFF" stopOpacity="0.32" />
                    <Stop offset="1" stopColor="#BFE3FF" stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={100} height={100} fill={`url(#${uid}wk)`} />
              </Svg>
            </Animated.View>
          </View>

          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: '#000', borderRadius: DOOR.r * s },
              turnShade,
            ]}
          />
        </Animated.View>

        {/* BACK FACE — mirrored so it reads correctly once the door is past perpendicular */}
        <Animated.View style={[StyleSheet.absoluteFill, backStyle]} pointerEvents="none">
          <View style={[StyleSheet.absoluteFill, { transform: [{ scaleX: -1 }] }]}>
            <Svg width={dw} height={dh} viewBox={`0 0 ${DOOR.w} ${DOOR.h}`}>
              <DoorBackArt uid={uid} />
            </Svg>
          </View>
        </Animated.View>
      </Animated.View>
    </>
  );
});

function DoorFrontArt({ uid }: { uid: string }) {
  const { w, h, r } = DOOR;
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}base`} x1="0" y1="0" x2="0.85" y2="1">
          <Stop offset="0" stopColor="#3C4352" />
          <Stop offset="0.3" stopColor="#272C37" />
          <Stop offset="0.68" stopColor="#1B1F27" />
          <Stop offset="1" stopColor="#12151B" />
        </LinearGradient>
        <RadialGradient id={`${uid}sheen`} cx="18%" cy="10%" r="75%">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.15" />
          <Stop offset="0.5" stopColor="#fff" stopOpacity="0.04" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id={`${uid}rshade`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000" stopOpacity="0.42" />
        </LinearGradient>
        <LinearGradient id={`${uid}bshade`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000" stopOpacity="0.36" />
        </LinearGradient>
        <LinearGradient id={`${uid}hi`} x1="0" y1="0" x2="1" y2="0.6">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <Stop offset="0.45" stopColor="#fff" stopOpacity="0.1" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0.02" />
        </LinearGradient>
        <LinearGradient id={`${uid}reflect`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9BCBFF" stopOpacity="0" />
          <Stop offset="0.7" stopColor="#9BCBFF" stopOpacity="0.05" />
          <Stop offset="1" stopColor="#9BCBFF" stopOpacity="0.14" />
        </LinearGradient>
        <LinearGradient id={`${uid}inner`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#000" stopOpacity="0" />
          <Stop offset="0.5" stopColor="#000" stopOpacity="0.12" />
          <Stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </LinearGradient>
      </Defs>

      <Rect x={0} y={0} width={w} height={h} rx={r} fill={`url(#${uid}base)`} />
      <Rect x={0} y={0} width={w} height={h} rx={r} fill={`url(#${uid}sheen)`} />
      <Rect x={w - 46} y={0} width={46} height={h} rx={r} fill={`url(#${uid}rshade)`} />
      <Rect x={0} y={h - 130} width={w} height={130} rx={r} fill={`url(#${uid}bshade)`} />
      {/* reflected cool light from the floor glow */}
      <Rect x={0} y={h - 90} width={w} height={90} rx={r} fill={`url(#${uid}reflect)`} />
      {/* vertical soft reflection near the left edge */}
      <Rect x={9} y={36} width={3} height={h - 90} rx={1.5} fill="#fff" opacity={0.07} />
      {/* inner shadow along the edge, heavier bottom/right */}
      <Rect x={1.8} y={1.8} width={w - 3.6} height={h - 3.6} rx={r - 1.8} fill="none" stroke={`url(#${uid}inner)`} strokeWidth={3.6} />
      {/* edge highlight, strongest on the upper-left */}
      <Rect x={0.7} y={0.7} width={w - 1.4} height={h - 1.4} rx={r - 0.7} fill="none" stroke={`url(#${uid}hi)`} strokeWidth={1.4} />
    </G>
  );
}

function DoorBackArt({ uid }: { uid: string }) {
  const { w, h, r } = DOOR;
  const bins = [196, 254, 312];
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}liner`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2C3441" />
          <Stop offset="1" stopColor="#151A22" />
        </LinearGradient>
        <LinearGradient id={`${uid}bin`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8FBFEA" stopOpacity="0.28" />
          <Stop offset="1" stopColor="#8FBFEA" stopOpacity="0.06" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} rx={r} fill={`url(#${uid}liner)`} />
      {/* gasket */}
      <Rect x={9} y={9} width={w - 18} height={h - 18} rx={r - 8} fill="none" stroke="#06080B" strokeOpacity={0.7} strokeWidth={7} />
      <Rect x={14} y={14} width={w - 28} height={h - 28} rx={r - 12} fill="none" stroke="#fff" strokeOpacity={0.06} strokeWidth={1} />
      {bins.map((y) => (
        <G key={y}>
          <Path d={`M 30 ${y} L ${w - 30} ${y} L ${w - 24} ${y + 40} L 24 ${y + 40} Z`} fill={`url(#${uid}bin)`} />
          <Rect x={24} y={y + 38} width={w - 48} height={3} rx={1.5} fill="#fff" opacity={0.35} />
        </G>
      ))}
    </G>
  );
}
