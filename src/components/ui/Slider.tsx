import React, { useLayoutEffect, useMemo } from 'react';
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
  const fill = useSharedValue(value / 100);
  const pan = useMemo(() => {
    const drag = { width: 1, x0: 0, last: 0, onChange: null as Props['onChange'] | null };
    const set = (px: number) => {
      const next = Math.round(Math.min(1, Math.max(0, px / drag.width)) * 100);
      if (next !== drag.last) {
        drag.last = next;
        drag.onChange?.(next);
      }
    };
    return {
      ...PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          drag.x0 = event.nativeEvent.locationX;
          set(drag.x0);
        },
        onPanResponderMove: (_, gesture) => set(drag.x0 + gesture.dx),
      }),
      onLayout: (event: LayoutChangeEvent) => {
        drag.width = Math.max(1, event.nativeEvent.layout.width);
      },
      update: (next: number, callback: Props['onChange']) => {
        drag.last = next;
        drag.onChange = callback;
      },
    };
  }, []);

  useLayoutEffect(() => {
    pan.update(value, onChange);
  }, [pan, value, onChange]);

  React.useEffect(() => {
    fill.value = withTiming(value / 100, { duration: 120 });
  }, [value, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const knobStyle = useAnimatedStyle(() => ({ left: `${fill.value * 100}%` }));

  return (
    <View
      onLayout={pan.onLayout}
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
