# CoolBox motion system

Principle: **animation explains physical state.** Tokens live in `src/motion/index.ts`
(`Motion.duration / easing / spring / physics / press / camera / light / navigation`),
five personalities: MICRO · UI · PRODUCT · CINEMATIC · PHYSICS.

## Audit → classification

| Animation | Where | Class |
|---|---|---|
| Hinged door, thickness edge, handle latch, door sheen | `fridge/FridgeDoor`, `motion/doorSequence` | PRODUCT PHYSICS |
| Door overshoot / settle, lock tick | `doorSequence` | PRODUCT PHYSICS |
| Camera dolly (scale + yaw/pitch/roll arc + drift) | `SplashScreen` rig | CAMERA / CINEMATIC |
| Interior light from door angle, light spill, bloom | `CoolBoxFridge`, `FridgeInterior` | LIGHTING |
| Cold mood (idle / cooling / approaching / reached), rings, success ripple | `useApplianceMood`, `FridgeGroundShadow` | LIGHTING |
| Layer counter-scaling (background 10%, floor 20%, interior ≈ 94–100%, interior light 45%) | `CoolBoxFridge` | DEPTH / PARALLAX |
| Door cast shadow (interior + floor) | `CoolBoxFridge`, `FridgeGroundShadow` | DEPTH |
| Press compress → overshoot → settle | `PressableScale` | MICRO |
| Fan inertia (angular velocity integrated per frame) | `ui/Motion.SpinningFan` | PRODUCT PHYSICS |
| Snowflake pulse / calm | `ui/Motion.PulsingSnow` | STATE |
| Rolling digits | `ui/RollingNumber` | STATE |
| Status pill phases, target pop, bell ring, Wi-Fi pop/heartbeat, tile lift | `HomeScreen` | STATE / MICRO |
| Depth-ordered Home emergence | `ui/Reveal`, `HomeScreen` | CINEMATIC |
| Tab content (directional, incoming toward lens, outgoing recedes) | `Navigator.TabLayer` | NAVIGATION |
| Indicator stretch while travelling | `BottomNavigation` | NAVIGATION |
| Temperature grows out of the hero; sheets rise; pushes slide | `Navigator.StackLayer` | NAVIGATION |
| Dial wake-up, knob spring | `TemperatureScreen` | STATE |
| Line draw + riding tip + sample markers; temperature chip flies into header | `StatisticsScreen` | DATA VISUALIZATION |

## Notes
- All frame-by-frame values are Reanimated shared values; React state only changes on real events.
- `ReducedMotionConfig(Never)` in `App.tsx` keeps the product animation on when the OS has Reduce Motion enabled.
- Dev-only web URL params for testing: `?skip=1&tab=stats&push=temperature`.
