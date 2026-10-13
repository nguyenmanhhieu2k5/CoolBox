import { useSyncExternalStore } from 'react';

/** Local, app-only preferences (security toggles, profile). Device state lives in the CoolBox service. */
export interface Prefs {
  pin: boolean;
  biometric: boolean;
  appLock: boolean;
  deviceProtection: boolean;
  notifyTarget: boolean;
  notifyWifi: boolean;
}

let prefs: Prefs = {
  pin: true,
  biometric: true,
  appLock: false,
  deviceProtection: true,
  notifyTarget: true,
  notifyWifi: true,
};
const listeners = new Set<() => void>();

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  prefs = { ...prefs, [key]: value };
  listeners.forEach((l) => l());
}

export function usePrefs<T>(selector: (p: Prefs) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => selector(prefs),
    () => selector(prefs),
  );
}
