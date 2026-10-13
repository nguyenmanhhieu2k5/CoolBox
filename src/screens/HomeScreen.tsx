import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Bell, CircleCheck, Thermometer, Wifi, WifiOff } from 'lucide-react-native';
import { colors, radius, shadow, type } from '../theme';
import { Motion, easeOutBack, easeOutCubic } from '../motion';
import { closeDoor, openDoor } from '../motion/doorSequence';
import { CoolingPhase, useApplianceMood, useCoolingPhase } from '../motion/useApplianceMood';
import { sharedRects } from '../motion/sharedRects';
import { useLayout } from '../hooks/useLayout';
import { useNav } from '../navigation/NavContext';
import { actions, useCoolBox } from '../state/useCoolBox';
import { CoolBoxFridge } from '../components/fridge/CoolBoxFridge';
import { PressableScale } from '../components/ui/PressableScale';
import { Reveal } from '../components/ui/Reveal';
import { RollingNumber } from '../components/ui/RollingNumber';
import { PulsingSnow, SpinningFan } from '../components/ui/Motion';
import { Slider } from '../components/ui/Slider';
import { Page } from './Page';
import { VB_H, VB_W } from '../components/fridge/geometry';

const PHASES: Record<CoolingPhase, { label: string; color: string; bg: string; idx: number }> = {
  cooling: { label: 'Đang làm lạnh', color: colors.primary, bg: '#E3EFFF', idx: 0 },
  approaching: { label: 'Sắp đạt mục tiêu', color: '#2B8CE8', bg: '#E6F3FF', idx: 1 },
  reached: { label: 'Đã đạt nhiệt độ mục tiêu', color: '#1E9E4A', bg: '#E7F7EC', idx: 2 },
  off: { label: 'Làm lạnh đã tắt', color: colors.secondary, bg: '#EEF1F5', idx: 3 },
};
const BG = [PHASES.cooling.bg, PHASES.approaching.bg, PHASES.reached.bg, PHASES.off.bg];
const FG = [PHASES.cooling.color, PHASES.approaching.color, PHASES.reached.color, PHASES.off.color];

const fmtTarget = (t: number) => (t % 1 ? t.toFixed(1) : String(t));

export function HomeScreen() {
  const l = useLayout();
  const { intro, push } = useNav();
  const target = useCoolBox((s) => s.targetTemperature);
  const temp = useCoolBox((s) => s.currentTemperature);
  const unread = useCoolBox((s) => s.notifications.filter((n) => !n.read).length);
  const mood = useApplianceMood();

  const door = useSharedValue(0);
  const activation = useSharedValue(1);
  const doorOpen = useRef(false);
  const toggleDoor = () => {
    doorOpen.current = !doorOpen.current;
    if (doorOpen.current) openDoor(door);
    else closeDoor(door);
  };

  const heroRef = useRef<View>(null);
  const measureHero = () =>
    heroRef.current?.measureInWindow((x, y, w, h) => {
      if (w > 0) sharedRects.setHero({ x, y, w, h });
    });
  const openTemperature = () => {
    heroRef.current?.measureInWindow((x, y, w, h) => {
      if (w > 0) sharedRects.setHero({ x, y, w, h });
      push('temperature', w > 0 ? { x: x + w / 2, y: y + h / 2 } : undefined);
    });
  };

  const fw = l.wide ? l.homeFridgeWidth : Math.min(l.homeFridgeWidth * 1.08, 250);
  const fh = (fw * VB_H) / VB_W;

  // The fridge stabilises out of the push-in: arrives large (near the lens), settles with a hair of overshoot.
  const fridgeStyle = useAnimatedStyle(() => {
    const t = interpolate(intro.value, [0.18, 0.66], [0, 1], 'clamp');
    const p = easeOutBack(t, 0.9);
    return { opacity: Math.min(1, t * 2), transform: [{ scale: 1.2 - p * 0.2 }, { translateY: (1 - p) * 14 }] };
  });

  // Bell rings a little when something new arrives
  const ring = useSharedValue(0);
  const lastUnread = useRef(unread);
  useEffect(() => {
    if (unread > lastUnread.current) {
      ring.value = withSequence(
        withTiming(14, { duration: 70 }),
        withTiming(-11, { duration: 110 }),
        withTiming(7, { duration: 100 }),
        withTiming(-3, { duration: 90 }),
        withSpring(0, Motion.spring.settle),
      );
    }
    lastUnread.current = unread;
  }, [unread]);
  const bellStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring.value}deg` }] }));

  const header = (
    <Reveal progress={intro} from={0.2} to={0.48} rise={8} depth={0.98}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={type.title}>CoolBox</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: mood.online ? colors.success : colors.warning, marginRight: 7 }} />
            <Text style={type.caption}>{mood.online ? 'Đang hoạt động' : 'Đang kết nối lại…'}</Text>
          </View>
        </View>
        <PressableScale
          onPress={() => push('notifications')}
          accessibilityLabel="Thông báo"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.soft }}
        >
          <Animated.View style={bellStyle}>
            <Bell size={20} color={colors.text} strokeWidth={2} />
          </Animated.View>
          {unread > 0 ? (
            <View style={{ position: 'absolute', top: 10, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger, borderWidth: 1.5, borderColor: '#fff' }} />
          ) : null}
        </PressableScale>
      </View>
    </Reveal>
  );

  const readout = (
    <>
      {/* nearest to the lens: the temperature appears first and settles back into place */}
      <View ref={heroRef} onLayout={measureHero} collapsable={false} style={{ alignItems: l.wide ? 'flex-start' : 'center', marginTop: l.wide ? 28 : 6 }}>
        <Reveal progress={intro} from={0.0} to={0.36} rise={6} depth={1.12} settle>
          <PressableScale onPress={openTemperature} pressedScale={0.985} accessibilityLabel={`Nhiệt độ hiện tại ${temp.toFixed(1)} độ C. Chạm để đặt nhiệt độ`}>
            <RollingNumber
              value={temp}
              textStyle={{ ...type.hero }}
              suffix={<Text style={[type.hero, { fontSize: 30, letterSpacing: -0.5, marginTop: 12, marginLeft: 2, color: colors.primary, fontWeight: '300' }]}>°C</Text>}
            />
          </PressableScale>
        </Reveal>
        <Reveal progress={intro} from={0.1} to={0.4} rise={6} depth={1.04}>
          <TargetLine target={target} onPress={openTemperature} />
        </Reveal>
      </View>
      <Reveal progress={intro} from={0.46} to={0.7} rise={8} depth={0.96} settle style={{ alignItems: l.wide ? 'flex-start' : 'center', marginTop: 12 }}>
        <StatusPill />
      </Reveal>
    </>
  );

  const fridge = (
    <Animated.View style={[{ alignItems: 'center', marginTop: l.wide ? 0 : 8 }, fridgeStyle]}>
      <PressableScale onPress={toggleDoor} pressedScale={0.99} accessibilityLabel="Mở hoặc đóng cửa tủ" style={{ width: fw, height: fh }}>
        <CoolBoxFridge
          width={fw}
          door={door}
          activation={activation}
          cold={mood.cold}
          calm={mood.calm}
          pulse={mood.pulse}
          online={mood.online}
          label={`${Math.round(target)}°`}
          cooling={mood.phase !== 'off'}
        />
      </PressableScale>
    </Animated.View>
  );

  const controls = <Controls l={l} intro={intro} phase={mood.phase} openTemperature={openTemperature} />;

  if (l.wide) {
    return (
      <Page wide>
        {header}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 56, marginTop: 8 }}>
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 40 }}>{fridge}</View>
          <View style={{ flex: 1 }}>
            {readout}
            {controls}
          </View>
        </View>
      </Page>
    );
  }

  return (
    <Page>
      {header}
      {readout}
      {fridge}
      {controls}
    </Page>
  );
}

/** "Mục tiêu 10°C" — gives a small tactile pop whenever the target changes. */
function TargetLine({ target, onPress }: { target: number; onPress: () => void }) {
  const pop = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    pop.value = withSequence(withTiming(1.1, { duration: 90 }), withSpring(1, Motion.spring.press));
  }, [target]);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <PressableScale onPress={onPress} pressedScale={0.97} accessibilityLabel="Đặt nhiệt độ mục tiêu">
      <Animated.Text style={[type.body, { color: colors.secondary, marginTop: 2 }, s]}>
        Mục tiêu <Text style={{ color: colors.text, fontWeight: '700' }}>{fmtTarget(target)}°C</Text>
      </Animated.Text>
    </PressableScale>
  );
}

/** COOLING → APPROACHING → REACHED (or OFF): colours blend, the pill pops on each change. */
function StatusPill() {
  const phase = useCoolingPhase();
  const p = PHASES[phase];
  const idx = useSharedValue(p.idx);
  const pop = useSharedValue(1);
  const check = useSharedValue(phase === 'reached' ? 1 : 0);
  const first = useRef(true);
  useEffect(() => {
    idx.value = withTiming(p.idx, { duration: Motion.duration.product, easing: Motion.easing.ui });
    check.value = withTiming(phase === 'reached' ? 1 : 0, { duration: Motion.duration.ui });
    if (first.current) {
      first.current = false;
      return;
    }
    pop.value = withSequence(withTiming(1.06, { duration: 110 }), withSpring(1, Motion.spring.settle));
  }, [phase]);

  const pill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(idx.value, [0, 1, 2, 3], BG),
    transform: [{ scale: pop.value }],
  }));
  const label = useAnimatedStyle(() => ({ color: interpolateColor(idx.value, [0, 1, 2, 3], FG) }));
  const icon = useAnimatedStyle(() => ({ opacity: 1 - check.value, transform: [{ scale: 1 - check.value * 0.5 }] }));
  const tick = useAnimatedStyle(() => ({ opacity: check.value, transform: [{ scale: 0.4 + check.value * 0.6 }] }));

  return (
    <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, gap: 8 }, pill]}>
      <View style={{ width: 16, height: 16 }}>
        <Animated.View style={[{ position: 'absolute' }, icon]}>
          <PulsingSnow on={phase === 'cooling' || phase === 'approaching'} calm={phase === 'approaching'} size={16} color={p.color} />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute' }, tick]}>
          <CircleCheck size={16} color={PHASES.reached.color} strokeWidth={2.4} />
        </Animated.View>
      </View>
      <Animated.Text style={[{ ...type.body, fontSize: 14, fontWeight: '600' }, label]}>{p.label}</Animated.Text>
    </Animated.View>
  );
}

function Controls({ l, intro, phase, openTemperature }: {
  l: ReturnType<typeof useLayout>;
  intro: { value: number };
  phase: CoolingPhase;
  openTemperature: () => void;
}) {
  const target = useCoolBox((s) => s.targetTemperature);
  const temp = useCoolBox((s) => s.currentTemperature);
  const peltier = useCoolBox((s) => s.peltierOn);
  const fanOn = useCoolBox((s) => s.fanOn);
  const fanSpeed = useCoolBox((s) => s.fanSpeed);
  const power = useCoolBox((s) => s.coolingPower);
  const wifi = useCoolBox((s) => s.wifiConnected);

  return (
    <View style={{ marginTop: l.wide ? 28 : 18 }}>
      {/* the controls land last (before the tab bar) */}
      <Reveal progress={intro} from={0.68} to={0.94} rise={14} depth={0.94} settle>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Tile label="Nhiệt độ" value={`${fmtTarget(target)}°C`} active onPress={openTemperature}
            icon={<Thermometer size={22} color={colors.primary} strokeWidth={2} />} />
          <Tile label="Peltier" value={peltier ? 'Bật' : 'Tắt'} active={peltier} onPress={() => actions.setPeltier(!peltier)}
            icon={<PulsingSnow on={peltier} calm={phase === 'reached'} size={22} color={peltier ? colors.primary : '#9AA3B2'} />} />
          <Tile label="Quạt" value={fanOn ? `${fanSpeed}%` : 'Tắt'} active={fanOn} onPress={() => actions.setFan(!fanOn)}
            icon={<SpinningFan on={fanOn} speed={fanSpeed} size={22} color={fanOn ? colors.primary : '#9AA3B2'} />} />
        </View>
      </Reveal>

      {/* power / fan status arrives before the controls themselves */}
      <Reveal progress={intro} from={0.56} to={0.8} rise={10} depth={0.97}>
        <View style={{ marginTop: 18, paddingHorizontal: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={type.caption}>Tốc độ quạt</Text>
            <Text style={[type.caption, { color: colors.text, fontVariant: ['tabular-nums'] }]}>{fanOn ? fanSpeed : 0}%</Text>
          </View>
          <Slider value={fanOn ? fanSpeed : 0} onChange={actions.setFanSpeed} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <View style={[card, { flex: 1 }]}>
            <Text style={type.caption}>Công suất</Text>
            <Text style={{ ...type.heading, fontSize: 22, marginTop: 4, fontVariant: ['tabular-nums'] }}>{Math.round(power)}%</Text>
            <PowerBar value={power} calm={phase === 'reached'} />
          </View>
          <View style={[card, { flex: 1 }]}>
            <Text style={type.caption}>Wi-Fi</Text>
            <WifiState connected={wifi} />
            <Text style={[type.caption, { marginTop: 8, fontSize: 12 }]}>Nhiệt độ {temp.toFixed(1)}°C</Text>
          </View>
        </View>
      </Reveal>
    </View>
  );
}

const card = { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, ...shadow.soft } as const;

/** Wi-Fi state change is a real event: the icon pops in, and a lost link breathes amber. */
function WifiState({ connected }: { connected: boolean }) {
  const pop = useSharedValue(1);
  const beat = useSharedValue(0);
  const first = useRef(true);
  useEffect(() => {
    if (!first.current) pop.value = withSequence(withTiming(0.6, { duration: 90 }), withSpring(1, { damping: 9, stiffness: 260 }));
    first.current = false;
    cancelAnimation(beat);
    if (connected) beat.value = withTiming(0, { duration: 250 });
    else beat.value = withRepeat(withTiming(1, { duration: 900, easing: Motion.easing.breathe }), -1, true);
  }, [connected]);
  const icon = useAnimatedStyle(() => ({
    opacity: connected ? 1 : 0.45 + beat.value * 0.55,
    transform: [{ scale: pop.value }],
  }));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
      <Animated.View style={icon}>
        {connected ? <Wifi size={20} color={colors.primary} strokeWidth={2.2} /> : <WifiOff size={20} color={colors.warning} strokeWidth={2.2} />}
      </Animated.View>
      <Text style={type.body}>{connected ? 'Đã kết nối' : 'Mất kết nối'}</Text>
    </View>
  );
}

function PowerBar({ value, calm }: { value: number; calm: boolean }) {
  const p = useSharedValue(value / 100);
  const c = useSharedValue(calm ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(value / 100, Motion.spring.gauge);
  }, [value]);
  useEffect(() => {
    c.value = withTiming(calm ? 1 : 0, { duration: Motion.light.moodMs });
  }, [calm]);
  const s = useAnimatedStyle(() => ({
    width: `${p.value * 100}%`,
    backgroundColor: interpolateColor(c.value, [0, 1], [colors.primary, '#5FB4F5']),
  }));
  return (
    <View style={{ height: 5, borderRadius: 3, backgroundColor: '#E8EDF4', marginTop: 12, overflow: 'hidden' }}>
      <Animated.View style={[{ height: 5, borderRadius: 3 }, s]} />
    </View>
  );
}

function Tile({ label, value, icon, active, onPress }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  const a = useSharedValue(active ? 1 : 0);
  const lift = useSharedValue(0);
  const first = useRef(true);
  useEffect(() => {
    a.value = withTiming(active ? 1 : 0, { duration: Motion.duration.ui });
    if (!first.current) lift.value = withSequence(withTiming(1, { duration: 120 }), withSpring(0, Motion.spring.settle));
    first.current = false;
  }, [active]);
  const glow = useAnimatedStyle(() => ({ opacity: a.value }));
  const body = useAnimatedStyle(() => ({ transform: [{ translateY: -2 * lift.value }] }));
  return (
    <PressableScale onPress={onPress} style={{ flex: 1 }} accessibilityLabel={`${label} ${value}`}>
      <Animated.View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', overflow: 'hidden', ...shadow.soft }, body]}>
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.primarySoft, opacity: 0.55 }, glow]}
        />
        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
        <Text style={[type.caption, { marginTop: 6, fontSize: 12 }]}>{label}</Text>
        <Text style={{ ...type.body, fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] }}>{value}</Text>
      </Animated.View>
    </PressableScale>
  );
}
