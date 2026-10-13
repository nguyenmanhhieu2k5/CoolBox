import React, { useRef } from 'react';
import { LayoutChangeEvent, PanResponder, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../../theme';

interface Props {
  value: number; // 0..100
  onChange: (v: number) => void;
  disabled?: boolean;
}

/** Slim slider. Track fill follows the finger immediately; the value is committed on every move. */
export function Slider({ value, onChange, disabled }: Props) {
  const width = useRef(1);
  const x0 = useRef(0);
  const fill = useSharedValue(value / 100);
  const last = useRef(value);

  React.useEffect(() => {
    last.current = value;
    fill.value = withTiming(value / 100, { duration: 120 });
  }, [value]);

  const set = (px: number) => {
    const v = Math.round(Math.min(1, Math.max(0, px / width.current)) * 100);
    if (v !== last.current) {
      last.current = v;
      onChange(v);
    }
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        x0.current = e.nativeEvent.locationX;
        set(x0.current);
      },
      onPanResponderMove: (_, g) => set(x0.current + g.dx),
    }),
  ).current;

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const knobStyle = useAnimatedStyle(() => ({ left: `${fill.value * 100}%` }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => (width.current = e.nativeEvent.layout.width)}
      style={{ height: 28, justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}
      pointerEvents={disabled ? 'none' : 'auto'}
      {...pan.panHandlers}
    >
      <View style={{ height: 6, borderRadius: 3, backgroundColor: '#E3E8F0', overflow: 'hidden' }}>
        <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: colors.primary }, fillStyle]} />
      </View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 22,
            height: 22,
            borderRadius: 11,
            marginLeft: -11,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#14285A',
            shadowOpacity: 0.2,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 2 },
          },
          knobStyle,
        ]}
      />
    </View>
  );
}
