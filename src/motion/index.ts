import { Easing } from 'react-native-reanimated';

/**
 * CoolBox motion language. Five personalities, never one easing everywhere:
 *
 *  MICRO      fast, subtle, responsive (presses, toggles, small state flips)
 *  UI         smooth and controlled (screens, chips, lists)
 *  PRODUCT    physical and weighted (door, fan, nav indicator)
 *  CINEMATIC  slow, layered, dramatic (splash camera, light)
 *  PHYSICS    springs with inertia / controlled overshoot
 *
 * Animation explains physical state: the door has weight, the fan has inertia,
 * light comes from inside, near things move more than far things.
 */
export const Motion = {
  duration: {
    micro: 110,
    fast: 180,
    ui: 320,
    product: 620,
    cinematic: 1200,
    glacial: 2400,
  },

  easing: {
    /** gentle deceleration for UI */
    ui: Easing.bezier(0.22, 0.61, 0.36, 1),
    /** appliance feel: slow start (inertia) → confident middle → soft landing */
    product: Easing.bezier(0.42, 0.0, 0.18, 1),
    /** camera dolly: eases in from rest, glides, never snaps to a stop */
    cinematic: Easing.bezier(0.45, 0.02, 0.2, 1),
    /** heavy door starts moving (gasket releases) then runs */
    unstick: Easing.out(Easing.quad),
    swing: Easing.bezier(0.25, 0.5, 0.28, 1),
    accelerate: Easing.in(Easing.cubic),
    decelerate: Easing.out(Easing.cubic),
    linear: Easing.linear,
    breathe: Easing.inOut(Easing.sin),
  },

  spring: {
    /** buttons / small controls */
    press: { damping: 13, stiffness: 320, mass: 0.7 },
    /** controlled overshoot, e.g. nav indicator, cards settling */
    settle: { damping: 18, stiffness: 210, mass: 0.9 },
    /** heavy: sheets and big surfaces */
    heavy: { damping: 20, stiffness: 150, mass: 1.15 },
    /** door settling after the swing: tiny, weighted wobble */
    door: { damping: 11, stiffness: 150, mass: 1.4 },
    /** gauges / bars follow data softly */
    gauge: { damping: 22, stiffness: 120, mass: 1 },
    /** dial knob, follows finger */
    knob: { damping: 18, stiffness: 190, mass: 0.8 },
  },

  /** Physical constants for the appliance. */
  physics: {
    doorOpenDeg: 90,
    doorOvershootDeg: 93.2,
    /** fan: deg/s at 100% speed; spin-up / spin-down time-constants (ms) */
    fanMaxDegPerSec: 820,
    fanSpinUpMs: 1500,
    fanSpinDownMs: 3000,
  },

  press: {
    down: 0.97,
    overshoot: 1.02,
    downMs: 70,
    upMs: 120,
  },

  camera: {
    /** final push-in factor on Splash (relative to the cavity centre) */
    maxZoom: 4.6,
    /** how much of the zoom the shallow layers (background, floor) follow */
    parallax: { background: 0.1, floor: 0.2, interior: 0.7, interiorLight: 0.45, body: 1, foreground: 1.1 },
    /** peak camera arc (deg) while orbiting in */
    arcYaw: 4.5,
    arcPitch: 2,
  },

  light: {
    /** how fast the appliance lighting changes mood */
    moodMs: 900,
    pulseMs: 1700,
  },

  navigation: {
    tabDistance: 0.22,
    tabScaleOut: 0.045,
    stackMs: 440,
    sheetOutMs: 280,
  },
} as const;

/** Soft ease used by manual keyframes inside worklets. */
export function easeOutCubic(t: number) {
  'worklet';
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - c, 3);
}

export function easeInOutCubic(t: number) {
  'worklet';
  const c = Math.min(1, Math.max(0, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

/** 0..1 → eased value with a small overshoot (settling surfaces). */
export function easeOutBack(t: number, k = 1.2) {
  'worklet';
  const c = Math.min(1, Math.max(0, t));
  const p = c - 1;
  return 1 + p * p * ((k + 1) * p + k);
}
