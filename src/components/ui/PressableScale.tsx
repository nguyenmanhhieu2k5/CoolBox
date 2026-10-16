import React from 'react';
import { GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Motion } from '../../motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** How far the element compresses on press. */
  pressedScale?: number;
  children?: React.ReactNode;
}

/** Pressable with physical press feedback: compress → release past rest → settle. */
export function PressableScale({ style, pressedScale = Motion.press.down, onPressIn, onPressOut, children, ...rest }: Props) {
  const scale = useSharedValue(1);
  const dim = useSharedValue(1);

  const animated = useAnimatedStyle(() => ({
    opacity: dim.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e: GestureResponderEvent) => {
        scale.set(withTiming(pressedScale, { duration: Motion.press.downMs }));
        dim.set(withTiming(0.94, { duration: Motion.press.downMs }));
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        // physical release: springs past rest by a hair, then settles
        scale.set(withSequence(
          withTiming(Motion.press.overshoot, { duration: Motion.press.upMs, easing: Motion.easing.decelerate }),
          withSpring(1, Motion.spring.press),
        ));
        dim.set(withTiming(1, { duration: 160 }));
        onPressOut?.(e);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
