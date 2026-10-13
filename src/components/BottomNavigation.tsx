import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { ChartLine, House, LucideIcon, Settings } from 'lucide-react-native';
import { colors, shadow, type } from '../theme';
import { easeOutBack } from '../motion';
import { PressableScale } from './ui/PressableScale';
import type { AnimValue } from './fridge/animTypes';
import { TABS, TabKey } from '../navigation/NavContext';

const ITEMS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'home', label: 'Trang chủ', icon: House },
  { key: 'stats', label: 'Thống kê', icon: ChartLine },
  { key: 'settings', label: 'Cài đặt', icon: Settings },
];

interface Props {
  width: number;
  bottomInset: number;
  /** animated tab position, 0..2 (fractional while moving) */
  position: AnimValue;
  /** 0 visible .. 1 hidden (a detail screen is on top) */
  hidden: AnimValue;
  /** Home emergence 0..1 — the bar appears last */
  intro: AnimValue;
  onSelect: (t: TabKey) => void;
}

const BAR_H = 66;

export function BottomNavigation({ width, bottomInset, position, hidden, intro, onSelect }: Props) {
  const barW = Math.min(width - 32, 420);
  const itemW = (barW - 12) / 3;

  const wrapStyle = useAnimatedStyle(() => {
    // settles last, with a hair of overshoot, like a part clicking into place
    const appear = easeOutBack(interpolate(intro.value, [0.8, 1], [0, 1], Extrapolation.CLAMP), 1.0);
    const vis = appear * (1 - hidden.value);
    return {
      opacity: Math.min(1, vis * 1.5),
      transform: [{ translateY: (1 - vis) * (BAR_H + bottomInset + 20) }],
    };
  });
  // The indicator physically travels: it stretches while in motion and re-forms when it lands.
  const indicator = useAnimatedStyle(() => {
    const frac = Math.abs(position.value - Math.round(position.value));
    return {
      transform: [
        { translateX: position.value * itemW },
        { scaleX: 1 + frac * 0.8 },
        { scaleY: 1 - frac * 0.14 },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="box-none" style={[styles.wrap, { bottom: bottomInset + 6 }, wrapStyle]}>
      <View style={[styles.bar, { width: barW }]}>
        <Animated.View style={[styles.indicator, { width: itemW }, indicator]} />
        {ITEMS.map((it, i) => (
          <NavItem key={it.key} index={i} item={it} width={itemW} position={position} onPress={() => onSelect(TABS[i])} />
        ))}
      </View>
    </Animated.View>
  );
}

function NavItem({ item, index, width, position, onPress }: {
  item: (typeof ITEMS)[number];
  index: number;
  width: number;
  position: AnimValue;
  onPress: () => void;
}) {
  const Icon = item.icon;
  const active = useAnimatedStyle(() => {
    const a = interpolate(Math.abs(position.value - index), [0, 1], [1, 0], Extrapolation.CLAMP);
    return { opacity: a, transform: [{ translateY: -1.5 * a }, { scale: 1 + a * 0.12 }] };
  });
  const idle = useAnimatedStyle(() => {
    const a = interpolate(Math.abs(position.value - index), [0, 1], [1, 0], Extrapolation.CLAMP);
    return { opacity: 1 - a };
  });
  const label = useAnimatedStyle(() => {
    const a = interpolate(Math.abs(position.value - index), [0, 0.8], [1, 0], Extrapolation.CLAMP);
    return { opacity: a, transform: [{ translateY: (1 - a) * 4 }], height: 14 * a + 0.01, marginTop: 2 * a };
  });
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.92}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      style={[styles.item, { width }]}
    >
      <View style={{ width: 24, height: 24 }}>
        <Animated.View style={[StyleSheet.absoluteFill, idle]}>
          <Icon size={24} color="#9AA3B2" strokeWidth={1.9} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, active]}>
          <Icon size={24} color={colors.primary} strokeWidth={2.2} />
        </Animated.View>
      </View>
      <Animated.View style={[{ overflow: 'hidden' }, label]}>
        <Text style={[type.micro, { color: colors.primary, letterSpacing: 0.1, fontSize: 11 }]}>{item.label}</Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: {
    height: BAR_H,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: 6,
    flexDirection: 'row',
    ...shadow.soft,
    borderWidth: 1,
    borderColor: 'rgba(230,234,240,0.9)',
  },
  indicator: {
    position: 'absolute',
    left: 6,
    top: 6,
    bottom: 6,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
  },
  item: { height: '100%', alignItems: 'center', justifyContent: 'center' },
});
