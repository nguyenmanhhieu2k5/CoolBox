import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';
import { Motion } from '../motion';
import { useLayout } from '../hooks/useLayout';
import { BottomNavigation } from '../components/BottomNavigation';
import { NavProvider, RouteKey, TABS, TabKey } from './NavContext';
import { SplashScreen } from '../screens/SplashScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TemperatureScreen } from '../screens/TemperatureScreen';
import { ModeScreen } from '../screens/ModeScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SecurityScreen } from '../screens/SecurityScreen';
import { DeviceInfoScreen } from '../screens/DeviceInfoScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AboutScreen } from '../screens/AboutScreen';

const ROUTES: Record<RouteKey, React.ComponentType> = {
  temperature: TemperatureScreen,
  mode: ModeScreen,
  notifications: NotificationsScreen,
  security: SecurityScreen,
  device: DeviceInfoScreen,
  profile: ProfileScreen,
  about: AboutScreen,
};

interface StackItem {
  id: number;
  route: RouteKey;
  closing: boolean;
  /** window-space point the screen grows out of */
  origin?: { x: number; y: number };
}

/** How each route physically arrives: grows out of what was touched, rises as a sheet, or slides in. */
const KIND: Record<RouteKey, 'expand' | 'sheet' | 'push'> = {
  temperature: 'expand',
  mode: 'sheet',
  notifications: 'sheet',
  security: 'push',
  device: 'push',
  profile: 'push',
  about: 'push',
};

/** Dev/test hook on web only: ?skip=1&tab=stats&push=temperature */
function initialParams() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return {};
  const q = new URLSearchParams(window.location.search);
  return { skip: q.get('skip') === '1', tab: q.get('tab') as TabKey | null, push: q.get('push') as RouteKey | null };
}

/**
 * Small animated navigator: three tabs + a stack of detail screens, all driven by
 * Reanimated shared values so every change of screen is a transition, never a swap.
 */
export function Navigator() {
  const layout = useLayout();
  const params = useMemo(() => initialParams(), []);
  const [splashDone, setSplashDone] = useState(!!params.skip);
  const [tab, setTabState] = useState<TabKey>(params.tab && TABS.includes(params.tab) ? params.tab : 'home');
  const [visited, setVisited] = useState<TabKey[]>(['home', ...(params.tab ? [params.tab] : [])]);
  const [stack, setStack] = useState<StackItem[]>(
    params.push && ROUTES[params.push] ? [{ id: 1, route: params.push, closing: false }] : [],
  );
  const idRef = useRef(2);

  const intro = useSharedValue(params.skip ? 1 : 0);
  const position = useSharedValue(Math.max(0, TABS.indexOf(tab)));
  const targetIdx = useSharedValue(Math.max(0, TABS.indexOf(tab)));
  const hidden = useSharedValue(stack.length ? 1 : 0);
  const depth = useSharedValue(stack.length ? 1 : 0);

  const setTab = useCallback((t: TabKey) => {
    setTabState(t);
    setVisited((v) => (v.includes(t) ? v : [...v, t]));
    targetIdx.set(TABS.indexOf(t));
    // the indicator and the content travel together on one physical spring
    position.set(withSpring(TABS.indexOf(t), Motion.spring.settle));
  }, [position, targetIdx]);

  const push = useCallback((route: RouteKey, origin?: { x: number; y: number }) => {
    setStack((s) => [...s, { id: idRef.current++, route, closing: false, origin }]);
    hidden.set(withTiming(1, { duration: 260 }));
    depth.set(withTiming(1, { duration: Motion.navigation.stackMs, easing: Motion.easing.ui }));
  }, [hidden, depth]);

  const pop = useCallback(() => {
    setStack((s) => {
      const idx = s.map((i) => i.closing).lastIndexOf(false);
      if (idx < 0) return s;
      return s.map((it, i) => (i === idx ? { ...it, closing: true } : it));
    });
    if (stack.filter((i) => !i.closing).length <= 1) {
      hidden.set(withTiming(0, { duration: 340 }));
      depth.set(withTiming(0, { duration: Motion.navigation.stackMs, easing: Motion.easing.ui }));
    }
  }, [stack, hidden, depth]);

  const removeItem = useCallback((id: number) => setStack((s) => s.filter((i) => i.id !== id)), []);

  const nav = useMemo(() => ({ push, pop, setTab, tab, intro }), [push, pop, setTab, tab, intro]);

  // The screen underneath recedes (smaller, dimmer) as something comes in front of it.
  const baseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(depth.value, [0, 1], [1, 0.0]),
    transform: [{ scale: interpolate(depth.value, [0, 1], [1, 0.94]) }],
  }));

  const finishSplash = useCallback(() => setSplashDone(true), [setSplashDone]);

  return (
    <NavProvider value={nav}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, baseStyle]} pointerEvents={stack.length ? 'none' : 'auto'}>
          {TABS.map((t, i) =>
            visited.includes(t) ? (
              <TabLayer key={t} index={i} position={position} target={targetIdx} active={tab === t && !stack.length} width={layout.width}>
                {t === 'home' ? <HomeScreen /> : t === 'stats' ? <StatisticsScreen active={tab === 'stats'} /> : <SettingsScreen />}
              </TabLayer>
            ) : null,
          )}
        </Animated.View>

        {stack.map((item, i) => (
          <StackLayer
            key={item.id}
            item={item}
            top={i === stack.length - 1}
            onClosed={removeItem}
          />
        ))}

        <BottomNavigation
          width={layout.columnWidth}
          bottomInset={layout.insets.bottom}
          position={position}
          hidden={hidden}
          intro={intro}
          onSelect={setTab}
        />

        {!splashDone ? <SplashScreen intro={intro} onDone={finishSplash} /> : null}
      </View>
    </NavProvider>
  );
}

function TabLayer({ index, position, target, active, width, children }: {
  index: number;
  position: { readonly value: number };
  target: { readonly value: number };
  active: boolean;
  width: number;
  children: React.ReactNode;
}) {
  // Directional, with depth: the incoming screen arrives from its side, slightly toward the lens;
  // the outgoing screen slides away and recedes (smaller, fading) behind it.
  const style = useAnimatedStyle(() => {
    const d = index - position.value;
    const a = Math.min(1, Math.abs(d));
    const incoming = target.value === index;
    return {
      opacity: Math.pow(1 - a, incoming ? 1.1 : 1.6),
      transform: [
        { translateX: d * Math.min(width, 560) * Motion.navigation.tabDistance },
        { scale: incoming ? 1 + a * 0.03 : 1 - a * Motion.navigation.tabScaleOut },
      ],
    };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents={active ? 'auto' : 'none'}>
      {children}
    </Animated.View>
  );
}

function StackLayer({ item, top, onClosed }: { item: StackItem; top: boolean; onClosed: (id: number) => void }) {
  const { width, height } = useWindowDimensions();
  const p = useSharedValue(0);
  const Screen = ROUTES[item.route];
  const kind = KIND[item.route];
  const ox = item.origin?.x ?? width / 2;
  const oy = item.origin?.y ?? height * 0.18;

  useEffect(() => {
    const finish = (done?: boolean) => {
      'worklet';
      if (done && item.closing) runOnJS(onClosed)(item.id);
    };
    if (!item.closing) {
      if (kind === 'expand') p.value = withTiming(1, { duration: Motion.duration.product + 80, easing: Motion.easing.product });
      else if (kind === 'sheet') p.value = withSpring(1, Motion.spring.heavy);
      else p.value = withTiming(1, { duration: Motion.navigation.stackMs, easing: Motion.easing.ui });
    } else if (kind === 'sheet') {
      // closing: lifts a hair, then accelerates away
      p.value = withSequence(
        withTiming(1.012, { duration: 80, easing: Motion.easing.decelerate }),
        withTiming(0, { duration: Motion.navigation.sheetOutMs, easing: Motion.easing.accelerate }, finish),
      );
    } else {
      p.value = withTiming(0, { duration: kind === 'expand' ? 380 : 300, easing: kind === 'expand' ? Motion.easing.product : Motion.easing.ui }, finish);
    }
  }, [item.closing]);

  const style = useAnimatedStyle(() => {
    const v = p.value;
    if (kind === 'expand') {
      // grows out of the element that was touched (the temperature), rounded while it travels
      return {
        opacity: interpolate(v, [0, 0.35, 1], [0, 1, 1], 'clamp'),
        borderRadius: interpolate(v, [0, 1], [44, 0], 'clamp'),
        transform: [{ scale: 0.5 + 0.5 * v }, { translateY: (1 - v) * 10 }],
      };
    }
    if (kind === 'sheet') {
      return {
        opacity: interpolate(v, [0, 0.25, 1], [0, 1, 1], 'clamp'),
        borderRadius: interpolate(v, [0, 1], [30, 0], 'clamp'),
        transform: [{ translateY: (1 - v) * height * 0.42 }, { scale: 0.97 + 0.03 * Math.min(1, v) }],
      };
    }
    return {
      opacity: interpolate(v, [0, 0.5, 1], [0, 1, 1], 'clamp'),
      transform: [{ translateX: (1 - v) * width * 0.16 }, { scale: 0.985 + 0.015 * v }],
    };
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: colors.background, overflow: 'hidden', transformOrigin: kind === 'expand' ? `${ox}px ${oy}px` : '50% 50%' },
        kind === 'sheet' ? sheetShadow : null,
        style,
      ]}
      pointerEvents={top && !item.closing ? 'auto' : 'none'}
    >
      <Screen />
    </Animated.View>
  );
}

const sheetShadow = Platform.select({
  web: { boxShadow: '0 -18px 50px rgba(20, 40, 80, 0.18)' } as never,
  default: { shadowColor: '#14285A', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -10 } },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
});
