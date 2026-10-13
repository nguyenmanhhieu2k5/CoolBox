import { useEffect, useRef } from 'react';
import { Easing, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useCoolBox } from '../state/useCoolBox';
import { Motion } from './index';

export type CoolingPhase = 'cooling' | 'approaching' | 'reached' | 'off';

/** COOLING → APPROACHING TARGET → TARGET REACHED (or OFF). One definition for every screen. */
export function useCoolingPhase(): CoolingPhase {
  const status = useCoolBox((s) => s.status);
  const diff = useCoolBox((s) => s.currentTemperature - s.targetTemperature);
  if (status === 'off') return 'off';
  if (status === 'reached') return 'reached';
  return diff < 0.9 ? 'approaching' : 'cooling';
}

/**
 * The appliance lighting language, as shared values the fridge reads:
 *   idle      neutral soft light                  cold 0
 *   cooling   cold blue ambient + cooling rings   cold 1
 *   nearing   same, a little quieter              cold 0.72
 *   reached   soft stable blue, rings calm        cold 0.42, calm 1  (+ one-shot pulse)
 *   offline   subtle warning tint on the LED      (online=false)
 */
export function useApplianceMood() {
  const phase = useCoolingPhase();
  const online = useCoolBox((s) => s.wifiConnected);
  const cold = useSharedValue(phase === 'off' ? 0 : phase === 'reached' ? 0.42 : 1);
  const calm = useSharedValue(phase === 'reached' ? 1 : 0);
  const pulse = useSharedValue(0);
  const prev = useRef<CoolingPhase>(phase);

  useEffect(() => {
    const target = phase === 'off' ? 0 : phase === 'reached' ? 0.42 : phase === 'approaching' ? 0.72 : 1;
    cold.value = withTiming(target, { duration: Motion.light.moodMs, easing: Motion.easing.ui });
    calm.value = withTiming(phase === 'reached' ? 1 : 0, { duration: Motion.light.moodMs * 1.3, easing: Motion.easing.ui });
    if (phase === 'reached' && prev.current !== 'reached') {
      pulse.value = 0;
      pulse.value = withSequence(withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) }), withTiming(0, { duration: 1 }));
    }
    prev.current = phase;
  }, [phase]);

  return { phase, online, cold, calm, pulse };
}
