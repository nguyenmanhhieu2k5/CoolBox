import React, { createContext, useContext } from 'react';
import type { AnimValue } from '../components/fridge/animTypes';

export type TabKey = 'home' | 'stats' | 'settings';
export type RouteKey =
  | 'temperature'
  | 'mode'
  | 'notifications'
  | 'security'
  | 'device'
  | 'profile'
  | 'about';

export const TABS: TabKey[] = ['home', 'stats', 'settings'];

export interface Nav {
  /** `origin` (window px) lets a screen grow out of the element that opened it. */
  push: (route: RouteKey, origin?: { x: number; y: number }) => void;
  pop: () => void;
  setTab: (tab: TabKey) => void;
  tab: TabKey;
  /** 0..1 — Home emergence after the Splash push-in. Screens use it for staggered reveals. */
  intro: AnimValue;
}

const Ctx = createContext<Nav | null>(null);
export const NavProvider = Ctx.Provider;

export function useNav(): Nav {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNav outside NavProvider');
  return v;
}
