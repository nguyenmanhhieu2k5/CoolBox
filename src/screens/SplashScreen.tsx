import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable as RNPressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ChevronRight, Snowflake } from 'lucide-react-native';
import { colors, fontFamily, type } from '../theme';
import { Motion, easeOutCubic } from '../motion';
import { openDoor } from '../motion/doorSequence';
import { sharedRects } from '../motion/sharedRects';
import { useLayout } from '../hooks/useLayout';
import { useCoolBox } from '../state/useCoolBox';
import { CoolBoxFridge } from '../components/fridge/CoolBoxFridge';
import { CAVITY, VB_H, VB_W } from '../components/fridge/geometry';
import type { AnimValue } from '../components/fridge/animTypes';
import type { SharedValue } from 'react-native-reanimated';

/**
 * Timeline (ms). One continuous take:
 *
 *   0      press            button compresses, releases past rest; blue bloom
 *   90     wake             display lights, a band of light crosses the door
 *   520    latch release    handle draws out, door ticks free
 *   640    door swings      gasket releases → heavy swing → overshoot → settle
 *   300    camera starts    slow dolly during the swing …
 *   1250   … then commits   arcing push into the cavity, light floods, UI recedes
 *   2150   home emerges     flood thins, Home settles in layers
 */
const T = { press: 0, wake: 90, lock: 520, door: 640, camA: 300, camAEnd: 0.2, camADur: 900, camBDur: 1050, home: 2150 };

interface Props {
  intro: SharedValue<number>;
  onDone: () => void;
}

export function SplashScreen({ intro, onDone }: Props) {
  const l = useLayout();
  const started = useRef(false);
  const [isStarted, setStarted] = useState(false);
  const temp = useCoolBox((s) => s.currentTemperature);

  const door = useSharedValue(0);
  const activation = useSharedValue(0.1);
  const lock = useSharedValue(0);
  const sweep = useSharedValue(0);
  const cam = useSharedValue(0);
  const ui = useSharedValue(1);
  const press = useSharedValue(1);
  const glow = useSharedValue(0);
  const fade = useSharedValue(0);
  const enter = useSharedValue(0);
  const rest = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, { duration: Motion.duration.cinematic * 0.8, easing: Motion.easing.cinematic });
    // the product sits there, alive: a very slow breath of the camera while waiting
    rest.value = withRepeat(withTiming(1, { duration: 5200, easing: Motion.easing.breathe }), -1, true);
  }, []);

  const start = () => {
    if (started.current) return;
    started.current = true;
    setStarted(true);
    cancelAnimation(rest);

    // PHASE 1 — tactile press (compress → past rest → settle) and a blue bloom
    press.value = withSequence(
      withTiming(Motion.press.down - 0.01, { duration: Motion.press.downMs }),
      withTiming(Motion.press.overshoot, { duration: Motion.press.upMs, easing: Motion.easing.decelerate }),
      withSpring(1, Motion.spring.press),
    );
    glow.value = withTiming(1, { duration: 150 });

    // PHASE 2 — the appliance wakes: display, ambient glow, a band of light along the door
    activation.value = withDelay(T.wake, withTiming(1, { duration: 420, easing: Motion.easing.decelerate }));
    sweep.value = withDelay(T.wake + 40, withTiming(1, { duration: 820, easing: Motion.easing.breathe }));

    // PHASE 3 — latch: the handle draws out, holds, lets go
    lock.value = withDelay(
      T.lock,
      withSequence(withTiming(1, { duration: 110, easing: Motion.easing.decelerate }), withTiming(1, { duration: 120 }), withSpring(0, Motion.spring.settle)),
    );

    // PHASE 4/5 — heavy hinged swing; light spills from the first degrees (driven by door angle)
    openDoor(door, T.door);

    // CAMERA — slow dolly while the door swings, then the committed push into the cavity
    cam.value = withDelay(
      T.camA,
      withSequence(
        withTiming(T.camAEnd, { duration: T.camADur, easing: Motion.easing.linear }),
        withTiming(1, { duration: T.camBDur, easing: Motion.easing.cinematic }),
      ),
    );
    // the brand is left behind as soon as the door starts to swing
    ui.value = withDelay(T.door + 60, withTiming(0, { duration: 620, easing: Motion.easing.ui }));

    // PHASE 6 — Home emerges from the light
    fade.value = withDelay(T.home, withTiming(1, { duration: 760, easing: Motion.easing.ui }));
    intro.set(withDelay(
      T.home + 60,
      withTiming(1, { duration: 1150, easing: Motion.easing.product }, (done) => {
        if (done) runOnJS(onDone)();
      }),
    ));
  };

  const fw = l.splashFridgeWidth;
  const fh = (fw * VB_H) / VB_W;
  const ox = ((CAVITY.x + CAVITY.w / 2) / VB_W) * fw;
  const oy = ((CAVITY.y + CAVITY.h / 2) / VB_H) * fh;
  const MAX = Motion.camera.maxZoom;

  // The rig: scale, an arcing orbit (yaw / pitch / roll) and a small lateral drift, all derived
  // from one progress value, so it reads as a camera moving — not the fridge growing.
  const rigStyle = useAnimatedStyle(() => {
    const c = cam.value;
    const arc = Math.sin(Math.PI * Math.min(1, c));
    const e = easeOutCubic(enter.value);
    return {
      opacity: e,
      transform: [
        { perspective: fw * 4.2 },
        { translateX: -arc * fw * 0.035 },
        { translateY: (1 - e) * 10 + Math.sin(rest.value * Math.PI) * 1.6 * (1 - Math.min(1, c * 8)) },
        { rotateY: `${-arc * Motion.camera.arcYaw}deg` },
        { rotateX: `${arc * Motion.camera.arcPitch}deg` },
        { rotateZ: `${-arc * 0.7}deg` },
        { scale: (0.9 + 0.1 * e) * Math.pow(MAX, c) },
      ],
    };
  });

  // The brand recedes as if left behind by the camera: drifts up and out, softly enlarging.
  const brandStyle = useAnimatedStyle(() => {
    const e = easeOutCubic(enter.value);
    return {
      opacity: ui.value * e,
      transform: [{ translateY: (1 - ui.value) * -26 + (1 - e) * 12 }, { scale: 1 + (1 - ui.value) * 0.08 }],
    };
  });
  const btnStyle = useAnimatedStyle(() => {
    const e = easeOutCubic(enter.value);
    return {
      opacity: ui.value * e,
      transform: [{ scale: press.value }, { translateY: (1 - e) * 18 + (1 - ui.value) * 34 }],
    };
  });
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * ui.value,
    transform: [{ scale: press.value }, { translateY: (1 - ui.value) * 34 }],
  }));
  const floodStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cam.value, [0.55, 0.95], [0, 1], Extrapolation.CLAMP) * (1 - fade.value),
  }));
  const floodTemp = useAnimatedStyle(() => ({
    opacity: interpolate(cam.value, [0.8, 1], [0, 1], Extrapolation.CLAMP) * (1 - interpolate(fade.value, [0.2, 0.8], [0, 1], Extrapolation.CLAMP)),
    transform: [{ scale: 1.14 - 0.14 * easeOutCubic(interpolate(cam.value, [0.8, 1], [0, 1], Extrapolation.CLAMP)) }],
  }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: 1 - interpolate(fade.value, [0.7, 1], [0, 1], Extrapolation.CLAMP) }));
  const bgStyle = useAnimatedStyle(() => ({ opacity: 1 - interpolate(fade.value, [0, 0.9], [0, 1], Extrapolation.CLAMP) }));

  const hero = sharedRects.hero();
  const heroY = hero ? hero.y + hero.h / 2 : l.insets.top + 110;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, rootStyle]} pointerEvents={isStarted ? 'none' : 'auto'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }, bgStyle]} />
      <Halo glow={activation} cam={cam} />

      <View style={[styles.col, { paddingTop: l.insets.top + 14, paddingBottom: l.insets.bottom + 20 }]}>
        <Animated.View style={[styles.brand, brandStyle]}>
          <View style={styles.logo}>
            <Snowflake size={28} color="#fff" strokeWidth={2.2} />
          </View>
          <Text style={styles.name}>CoolBox</Text>
          <Text style={styles.sub}>Smart Mini Fridge</Text>
          <Text style={styles.tag}>Giữ trọn độ tươi ngon{'\n'}với công nghệ thông minh</Text>
        </Animated.View>

        <View style={styles.stage}>
          <Animated.View style={[{ width: fw, height: fh, transformOrigin: `${ox}px ${oy}px` }, rigStyle]}>
            <CoolBoxFridge
              width={fw}
              door={door}
              activation={activation}
              cold={activation}
              lock={lock}
              sweep={sweep}
              camera={cam}
              label="10°"
            />
          </Animated.View>
        </View>

        <View style={styles.btnWrap}>
          <Animated.View style={[styles.btnGlow, glowStyle]} pointerEvents="none" />
          <Animated.View style={btnStyle}>
            <StartButton onPress={start} />
          </Animated.View>
        </View>
      </View>

      {/* the cavity's own cold light, dominant at the end of the push-in */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, floodStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="flood" cx="50%" cy="40%" r="75%">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="0.55" stopColor="#E3F3FF" />
              <Stop offset="1" stopColor="#BFE0FA" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={100} fill="url(#flood)" />
        </Svg>
        <ColdMotes cam={cam} width={l.width} height={l.height} />
      </Animated.View>

      {/* inside the cold light, the temperature appears — Home's hero grows out of exactly this */}
      <Animated.View pointerEvents="none" style={[styles.floodTemp, { top: heroY - 50 }, floodTemp]}>
        <Text style={[type.hero, { color: '#0A3D7A', fontVariant: ['tabular-nums'] }]}>
          {temp.toFixed(1)}
          <Text style={{ fontSize: 30, color: colors.primary }}>°C</Text>
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

function StartButton({ onPress }: { onPress: () => void }) {
  return (
    <RNPressable accessibilityRole="button" accessibilityLabel="Bắt đầu" onPress={onPress} style={styles.btn}>
      <Text style={styles.btnText}>Bắt đầu</Text>
      <ChevronRight size={20} color="#fff" strokeWidth={2.6} />
    </RNPressable>
  );
}

/** Background: the slowest layer. Follows the dolly at ~10% of its rate. */
function Halo({ glow, cam }: { glow: AnimValue; cam: AnimValue }) {
  const s = useAnimatedStyle(() => ({
    opacity: 0.3 + glow.value * 0.55,
    transform: [{ scale: Math.pow(Motion.camera.maxZoom, cam.value * Motion.camera.parallax.background) }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="halo" cx="50%" cy="56%" r="46%">
            <Stop offset="0" stopColor="#72C8FF" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#72C8FF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill="url(#halo)" />
      </Svg>
    </Animated.View>
  );
}

const MOTES = 11;

/** A few motes of cold air in the beam. Restrained: 11 tiny dots, one shared driver. */
function ColdMotes({ cam, width, height }: { cam: AnimValue; width: number; height: number }) {
  const specs = useMemo(() => {
    let seed = 11;
    const samples: number[] = [];
    for (let index = 0; index < MOTES * 4; index++) {
      seed = (seed * 16807) % 2147483647;
      samples.push(seed / 2147483647);
    }
    return Array.from({ length: MOTES }, (_, index) => ({
      x: samples[index * 4] * width,
      y: samples[index * 4 + 1] * height,
      d: 0.5 + samples[index * 4 + 2] * 1.1,
      size: 2 + samples[index * 4 + 3] * 3,
    }));
  }, [width, height]);
  return (
    <>
      {specs.map((m, i) => (
        <Mote key={i} cam={cam} {...m} />
      ))}
    </>
  );
}

function Mote({ cam, x, y, d, size }: { cam: AnimValue; x: number; y: number; d: number; size: number }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(cam.value, [0.6, 0.85, 1], [0, 0.55, 0.3], Extrapolation.CLAMP) * (0.4 + d * 0.4),
    transform: [{ translateY: -(cam.value - 0.6) * 90 * d }, { translateX: Math.sin(cam.value * 6 + d * 3) * 6 * d }, { scale: d }],
  }));
  return (
    <Animated.View
      style={[{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size, backgroundColor: '#FFFFFF' }, style]}
    />
  );
}

const styles = StyleSheet.create({
  col: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  brand: { alignItems: 'center' },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  name: { fontFamily, fontSize: 36, fontWeight: '700', letterSpacing: -1.2, color: colors.text },
  sub: { ...type.caption, marginTop: 2 },
  tag: { ...type.caption, textAlign: 'center', marginTop: 10, lineHeight: 19, color: '#8A93A3' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btnWrap: { width: '100%', alignItems: 'center' },
  btnGlow: {
    position: 'absolute',
    alignSelf: 'center',
    width: 320,
    maxWidth: '86%',
    minWidth: 240,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    shadowColor: colors.ice,
    shadowOpacity: 1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  } as never,
  btn: {
    width: 320,
    maxWidth: '86%',
    minWidth: 240,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    cursor: 'pointer',
  } as never,
  btnText: { fontFamily, fontSize: 17, fontWeight: '600', color: '#fff', letterSpacing: -0.2 },
  floodTemp: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});
