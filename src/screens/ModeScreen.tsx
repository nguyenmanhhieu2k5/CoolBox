import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Check, LucideIcon, Snowflake, Leaf, Wand } from 'lucide-react-native';
import { colors, radius, shadow, type } from '../theme';
import { useNav } from '../navigation/NavContext';
import { actions, useCoolBox } from '../state/useCoolBox';
import type { OperatingMode } from '../services';
import { PressableScale } from '../components/ui/PressableScale';
import { ScreenHeader } from '../components/ui/kit';
import { Page } from './Page';

const MODES: { key: OperatingMode; title: string; desc: string; icon: LucideIcon }[] = [
  { key: 'auto', title: 'Tự động', desc: 'Tối ưu hiệu suất', icon: Wand },
  { key: 'fast', title: 'Làm lạnh nhanh', desc: 'Nhanh chóng, mạnh mẽ', icon: Snowflake },
  { key: 'eco', title: 'Tiết kiệm điện', desc: 'Ít tiêu thụ năng lượng', icon: Leaf },
];

export function ModeScreen() {
  const { pop } = useNav();
  const selected = useCoolBox((s) => s.selectedMode);
  return (
    <Page>
      <ScreenHeader title="Chế độ hoạt động" onBack={pop} />
      <View style={{ gap: 12, marginTop: 16 }}>
        {MODES.map((m) => (
          <ModeCard key={m.key} mode={m} selected={selected === m.key} onPress={() => actions.setMode(m.key)} />
        ))}
      </View>
      <Text style={[type.caption, { textAlign: 'center', marginTop: 24, paddingHorizontal: 20 }]}>
        Chế độ được áp dụng ngay cho bộ điều khiển Peltier và quạt.
      </Text>
    </Page>
  );
}

function ModeCard({ mode, selected, onPress }: { mode: (typeof MODES)[number]; selected: boolean; onPress: () => void }) {
  const p = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(selected ? 1 : 0, { damping: 18, stiffness: 190 });
  }, [selected]);
  const Icon = mode.icon;
  const card = useAnimatedStyle(() => ({
    borderColor: interpolateColor(p.value, [0, 1], ['rgba(20,120,255,0)', colors.primary]),
    backgroundColor: interpolateColor(p.value, [0, 1], ['#FFFFFF', '#F4F9FF']),
    transform: [{ scale: 1 + p.value * 0.012 }],
  }));
  const badge = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [colors.primarySoft, colors.primary]) }));
  const check = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: interpolate(p.value, [0, 1], [0.4, 1]) }] }));
  const ring = useAnimatedStyle(() => ({ borderColor: interpolateColor(p.value, [0, 1], ['#D5DCE6', colors.primary]) }));
  const iconOn = useAnimatedStyle(() => ({ opacity: p.value }));
  const iconOff = useAnimatedStyle(() => ({ opacity: 1 - p.value }));
  return (
    <PressableScale onPress={onPress} pressedScale={0.98} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: radius.lg, borderWidth: 1.5, ...shadow.soft }, card]}>
        <Animated.View style={[{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, badge]}>
          <Animated.View style={[{ position: 'absolute' }, iconOff]}><Icon size={24} color={colors.primary} strokeWidth={2} /></Animated.View>
          <Animated.View style={[{ position: 'absolute' }, iconOn]}><Icon size={24} color="#fff" strokeWidth={2} /></Animated.View>
        </Animated.View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={{ ...type.heading, fontSize: 17 }}>{mode.title}</Text>
          <Text style={[type.caption, { marginTop: 3 }]}>{mode.desc}</Text>
        </View>
        <Animated.View style={[{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, ring]}>
          <Animated.View style={[{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', position: 'absolute', margin: -2 }, check]}>
            <Check size={15} color="#fff" strokeWidth={3} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </PressableScale>
  );
}
