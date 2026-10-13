import React, { useEffect, useRef } from 'react';
import { PanResponder, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Minus, Plus, Wand } from 'lucide-react-native';
import { colors, radius, shadow, type } from '../theme';
import { useLayout } from '../hooks/useLayout';
import { useNav } from '../navigation/NavContext';
import { actions, useCoolBox } from '../state/useCoolBox';
import { TARGET_MAX, TARGET_MIN } from '../services';
import { PressableScale } from '../components/ui/PressableScale';
import { PulsingSnow } from '../components/ui/Motion';
import { RollingNumber } from '../components/ui/RollingNumber';
import { Motion } from '../motion';
import { useCoolingPhase } from '../motion/useApplianceMood';
import { Group, Row, ScreenHeader } from '../components/ui/kit';
import { Page } from './Page';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SWEEP = 270;
const START = 135;

const toFraction = (t: number) => (t - TARGET_MIN) / (TARGET_MAX - TARGET_MIN);
const fmt = (t: number) => (Math.round(t * 10) % 10 ? t.toFixed(1) : String(Math.round(t)));

export function TemperatureScreen() {
  const l = useLayout();
  const { pop } = useNav();
  const temp = useCoolBox((s) => s.currentTemperature);
  const target = useCoolBox((s) => s.targetTemperature);
  const power = useCoolBox((s) => s.coolingPower);
  const auto = useCoolBox((s) => s.autoMode);

  const size = Math.min(l.columnWidth - 56, 320, l.height * 0.4);
  const stroke = 16;
  const r = (size - stroke) / 2 - 4;
  const C = 2 * Math.PI * r;
  const c = size / 2;

  const phase = useCoolingPhase();
  const f = useSharedValue(toFraction(target));
  const cur = useSharedValue(toFraction(temp));
  // the dial "powers up" when the screen opens: the arc sweeps out to the target
  const wake = useSharedValue(0);
  useEffect(() => {
    wake.value = withDelay(120, withTiming(1, { duration: 900, easing: Motion.easing.product }));
  }, []);
  useEffect(() => {
    f.value = withSpring(toFraction(target), Motion.spring.knob);
  }, [target]);
  useEffect(() => {
    cur.value = withSpring(toFraction(Math.min(TARGET_MAX, Math.max(TARGET_MIN, temp))), Motion.spring.gauge);
  }, [temp]);

  const trackProps = useAnimatedProps(() => ({ strokeDasharray: `${C * (SWEEP / 360)} ${C}` }));
  const progressProps = useAnimatedProps(() => ({ strokeDasharray: `${Math.max(0.01, C * (SWEEP / 360) * f.value * wake.value)} ${C}` }));
  const knob = useAnimatedStyle(() => ({ opacity: wake.value, transform: [{ rotate: `${START + f.value * wake.value * SWEEP}deg` }] }));
  const currentMark = useAnimatedStyle(() => ({ opacity: wake.value, transform: [{ rotate: `${START + cur.value * SWEEP}deg` }] }));

  // drag the dial
  const down = useRef({ x: 0, y: 0 });
  const dial = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        down.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
        apply(down.current.x, down.current.y);
      },
      onPanResponderMove: (_, g) => apply(down.current.x + g.dx, down.current.y + g.dy),
    }),
  ).current;
  const sizeRef = useRef(size);
  sizeRef.current = size;
  function apply(x: number, y: number) {
    const cc = sizeRef.current / 2;
    const ang = (Math.atan2(y - cc, x - cc) * 180) / Math.PI;
    let rel = (ang - START + 720) % 360;
    if (rel > SWEEP) rel = rel > SWEEP + (360 - SWEEP) / 2 ? 0 : SWEEP;
    const t = Math.round((TARGET_MIN + (rel / SWEEP) * (TARGET_MAX - TARGET_MIN)) * 2) / 2;
    actions.setTarget(t);
  }

  const step = (d: number) => actions.setTarget(Math.round((target + d) * 2) / 2);

  return (
    <Page>
      <ScreenHeader title="Điều khiển nhiệt độ" onBack={pop} />

      <View style={{ alignItems: 'center', marginTop: 18 }}>
        <View style={{ width: size, height: size }} {...dial.panHandlers}>
          <Svg width={size} height={size} pointerEvents="none">
            <Defs>
              <LinearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={colors.ice} />
                <Stop offset="1" stopColor={colors.primary} />
              </LinearGradient>
            </Defs>
            <AnimatedCircle cx={c} cy={c} r={r} stroke="#E6ECF4" strokeWidth={stroke} strokeLinecap="round" fill="none" rotation={START} origin={`${c}, ${c}`} animatedProps={trackProps} />
            <AnimatedCircle cx={c} cy={c} r={r} stroke="url(#dialGrad)" strokeWidth={stroke} strokeLinecap="round" fill="none" rotation={START} origin={`${c}, ${c}`} animatedProps={progressProps} />
          </Svg>

          {/* current temperature tick */}
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, currentMark]}>
            <View style={{ position: 'absolute', left: c + r + stroke / 2 + 5, top: c - 1.5, width: 7, height: 3, borderRadius: 2, backgroundColor: colors.text, opacity: 0.35 }} />
          </Animated.View>
          {/* knob */}
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, knob]}>
            <View
              style={{
                position: 'absolute',
                left: c + r - 13,
                top: c - 13,
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: '#fff',
                borderWidth: 5,
                borderColor: colors.primary,
                ...shadow.soft,
              }}
            />
          </Animated.View>

          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={type.caption}>Hiện tại</Text>
            <RollingNumber
              value={temp}
              textStyle={{ ...type.hero, fontSize: size * 0.24, letterSpacing: -2 }}
              suffix={<Text style={[type.hero, { fontSize: size * 0.1, marginTop: size * 0.04, color: colors.primary, fontWeight: '300' }]}>°C</Text>}
            />
            <Text style={[type.body, { color: colors.secondary }]}>
              Mục tiêu <Text style={{ color: colors.text, fontWeight: '700' }}>{fmt(target)}°C</Text>
            </Text>
            <View style={{ marginTop: 10 }}>
              <PulsingSnow on={phase === 'cooling' || phase === 'approaching'} calm={phase === 'approaching'} size={22} color={phase === 'off' ? '#9AA3B2' : colors.primary} />
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 36, marginTop: 14 }}>
          <RoundBtn onPress={() => step(-0.5)} label="Giảm nhiệt độ"><Minus size={24} color={colors.text} strokeWidth={2.2} /></RoundBtn>
          <RoundBtn onPress={() => step(0.5)} label="Tăng nhiệt độ"><Plus size={24} color={colors.text} strokeWidth={2.2} /></RoundBtn>
        </View>
        <Text style={[type.micro, { marginTop: 10 }]}>{TARGET_MIN}°C – {TARGET_MAX}°C</Text>
      </View>

      <Group style={{ marginTop: 26, paddingVertical: 4 }}>
        <View style={{ paddingVertical: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={type.body}>Công suất làm lạnh</Text>
            <Text style={[type.body, { fontWeight: '700', fontVariant: ['tabular-nums'] }]}>{Math.round(power)}%</Text>
          </View>
          <PowerTrack value={power} />
        </View>
        <Row
          icon={Wand}
          title="Chế độ tự động"
          subtitle="Tự điều chỉnh công suất theo mục tiêu"
          toggle={{ value: auto, onChange: actions.setAutoMode }}
          last
        />
      </Group>
    </Page>
  );
}

function RoundBtn({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      pressedScale={0.9}
      style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.soft }}
    >
      {children}
    </PressableScale>
  );
}

function PowerTrack({ value }: { value: number }) {
  const p = useSharedValue(value / 100);
  useEffect(() => {
    p.value = withSpring(value / 100, { damping: 20, stiffness: 120 });
  }, [value]);
  const s = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: '#E8EDF4', marginTop: 12, overflow: 'hidden' }}>
      <Animated.View style={[{ height: 8, borderRadius: radius.pill, backgroundColor: colors.primary }, s]} />
    </View>
  );
}
