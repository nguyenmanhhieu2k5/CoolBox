import { useSyncExternalStore } from 'react';
import { coolBox } from '../services';
import type { CoolBoxState } from '../services';

/**
 * Shared global state. Every screen reads from the same service snapshot.
 * Pass a selector that returns a primitive (or a stable reference) so a screen
 * only re-renders when the slice it cares about changes.
 */
export function useCoolBox<T>(selector: (s: CoolBoxState) => T): T {
  return useSyncExternalStore(
    coolBox.subscribe,
    () => selector(coolBox.getState()),
    () => selector(coolBox.getState()),
  );
}

export const actions = {
  setTarget: (v: number) => coolBox.setTargetTemperature(v),
  setPeltier: (v: boolean) => coolBox.setPeltier(v),
  setFan: (v: boolean) => coolBox.setFan(v),
  setFanSpeed: (v: number) => coolBox.setFanSpeed(v),
  setAutoMode: (v: boolean) => coolBox.setAutoMode(v),
  setMode: (v: Parameters<typeof coolBox.setMode>[0]) => coolBox.setMode(v),
  setWifi: (v: boolean) => coolBox.setWifi(v),
  markRead: () => coolBox.markNotificationsRead(),
};
