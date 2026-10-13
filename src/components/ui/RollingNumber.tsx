import React, { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Motion } from '../../motion';

const INT_STACK = Array.from({ length: 41 }, (_, i) => i);
const DEC_STACK = Array.from({ length: 30 }, (_, i) => i % 10);

interface Props {
  value: number;
  /** text style — carries fontSize / weight / colour */
  textStyle: TextStyle;
  /** optional unit shown after the digits, e.g. "°C" */
  suffix?: React.ReactNode;
}

/**
 * Appliance-display number: digits roll vertically like a mechanical / LCD counter
 * instead of being swapped. Only the tenths wheel turns for small changes; the units
 * wheel follows when the value crosses a whole degree. The tenths wheel is cyclic,
 * so 10.0 → 9.9 turns the wheel one notch backwards rather than racing 0→9.
 */
export const RollingNumber = memo(function RollingNumber({ value, textStyle, suffix }: Props) {
  const v = Math.max(0, value);
  const tenths = Math.round(v * 10);
  const int = Math.floor(tenths / 10);
  const dec = tenths % 10;

  const fontSize = (textStyle.fontSize as number) ?? 40;
  const lineH = Math.round(fontSize * 1.1);
  const cell: TextStyle = { ...textStyle, lineHeight: lineH, fontVariant: ['tabular-nums'] };

  const intPos = useSharedValue(int);
  const decPos = useSharedValue(dec);
  const last = useRef(dec);
  const decTarget = useRef(dec);

  useEffect(() => {
    let d = dec - last.current;
    if (d > 5) d -= 10;
    if (d < -5) d += 10;
    last.current = dec;
    decTarget.current += d;
    const cfg = { duration: Motion.duration.product * 0.8, easing: Motion.easing.product };
    decPos.value = withTiming(decTarget.current, cfg);
    intPos.value = withTiming(int, cfg);
  }, [tenths]);

  const intStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -intPos.value * lineH }] }));
  const decStyle = useAnimatedStyle(() => {
    const p = ((decPos.value % 10) + 10) % 10 + 10;
    return { transform: [{ translateY: -p * lineH }] };
  });

  const intDigits = int >= 10 ? '00' : '0';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} accessibilityLabel={`${v.toFixed(1)}`} accessible>
      <View style={{ height: lineH, overflow: 'hidden' }}>
        <Text style={[cell, styles.sizer]}>{intDigits}</Text>
        <Animated.View style={[styles.stack, intStyle]}>
          {INT_STACK.map((n) => (
            <Text key={n} style={[cell, { textAlign: 'right' }]}>
              {n}
            </Text>
          ))}
        </Animated.View>
      </View>
      <Text style={cell}>.</Text>
      <View style={{ height: lineH, overflow: 'hidden' }}>
        <Text style={[cell, styles.sizer]}>0</Text>
        <Animated.View style={[styles.stack, decStyle]}>
          {DEC_STACK.map((n, i) => (
            <Text key={i} style={[cell, { textAlign: 'center' }]}>
              {n}
            </Text>
          ))}
        </Animated.View>
      </View>
      {suffix}
    </View>
  );
});

const styles = StyleSheet.create({
  sizer: { opacity: 0 },
  stack: { position: 'absolute', left: 0, right: 0, top: 0 },
});
