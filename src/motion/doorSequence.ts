import {
  SharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Motion } from './index';

/**
 * Physical door choreography (degrees). The door has mass:
 *
 *   lock release   a tiny reverse tick as the latch lets go (-0.7°), then a hair of play
 *   0 → 14°        unstick: quick initial movement as the gasket releases
 *   14 → 93°       heavy swing: slow build, long glide, soft deceleration at the end
 *   93 → 90°       the door overshoots a little and settles back
 */
export function openDoor(door: SharedValue<number>, delay = 0, onSettled?: () => void) {
  door.value = withDelay(
    delay,
    withSequence(
      withTiming(-0.7, { duration: 70, easing: Motion.easing.unstick }),
      withTiming(0.4, { duration: 90, easing: Motion.easing.breathe }),
      withTiming(14, { duration: 190, easing: Motion.easing.unstick }),
      withTiming(Motion.physics.doorOvershootDeg, { duration: 820, easing: Motion.easing.swing }),
      withSpring(Motion.physics.doorOpenDeg, Motion.spring.door, (done) => {
        'worklet';
        if (done && onSettled) onSettled();
      }),
    ),
  );
}

export function closeDoor(door: SharedValue<number>) {
  door.value = withSequence(
    withTiming(Motion.physics.doorOvershootDeg - 1, { duration: 90, easing: Motion.easing.breathe }),
    withTiming(10, { duration: 640, easing: Motion.easing.product }),
    withTiming(-0.6, { duration: 190, easing: Motion.easing.accelerate }),
    withSpring(0, { damping: 16, stiffness: 320, mass: 0.8 }),
  );
}
