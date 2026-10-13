import React from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { CoolBoxFridge } from './fridge/CoolBoxFridge';
import { VB_H, VB_W } from './fridge/geometry';

/** The same fridge component, scaled down and cropped to its silhouette (no new artwork). */
export function MiniFridge({ height }: { height: number }) {
  const w = (height * VB_W) / VB_H;
  const full = w * 1.0;
  // The body occupies ~x 18..270 of 280 in design space; keep it unclipped.
  const cold = useSharedValue(0); // thumbnail: no cooling rings
  return (
    <View style={{ width: w * 0.9, height }}>
      <CoolBoxFridge width={full * 0.98} label="10°" cold={cold} />
    </View>
  );
}
