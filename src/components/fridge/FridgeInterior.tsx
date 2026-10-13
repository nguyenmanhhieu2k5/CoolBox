import React, { memo } from 'react';
import Svg, {
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { BACK_WALL as BW, CAVITY as C, VB_H, VB_W } from './geometry';
import { useUid } from './useUid';
import type { AnimValue } from './animTypes';

interface Palette {
  back0: string;
  back1: string;
  wallL0: string;
  wallL1: string;
  wallR0: string;
  wallR1: string;
  ceil0: string;
  ceil1: string;
  floor0: string;
  floor1: string;
  shelfTop: string;
  shelfEdge: string;
  shelfLip: string;
  itemA: string;
  itemB: string;
  itemC: string;
  itemHi: string;
}

/** Light off: deep blue-charcoal, never pure black, so the cavity still has depth. */
const DARK: Palette = {
  back0: '#131B26',
  back1: '#0D131B',
  wallL0: '#080B10',
  wallL1: '#121A24',
  wallR0: '#06080C',
  wallR1: '#0E151E',
  ceil0: '#0B0F15',
  ceil1: '#10161F',
  floor0: '#090C11',
  floor1: '#0E141C',
  shelfTop: 'rgba(140,175,210,0.10)',
  shelfEdge: 'rgba(255,255,255,0.16)',
  shelfLip: 'rgba(150,185,220,0.16)',
  itemA: '#18222E',
  itemB: '#1D2834',
  itemC: '#141C26',
  itemHi: 'rgba(255,255,255,0.08)',
};

/** Light on: cool blue-white illumination from the LED strip at the top. */
const LIT: Palette = {
  back0: '#DDF1FF',
  back1: '#6FAEE0',
  wallL0: '#2A5584',
  wallL1: '#A5D3F5',
  wallR0: '#1F4468',
  wallR1: '#86BBE6',
  ceil0: '#F4FBFF',
  ceil1: '#BFE1FA',
  floor0: '#2A507A',
  floor1: '#5B93C6',
  shelfTop: 'rgba(225,244,255,0.42)',
  shelfEdge: 'rgba(255,255,255,0.95)',
  shelfLip: 'rgba(235,248,255,0.85)',
  itemA: '#CFE6FA',
  itemB: '#F4FAFF',
  itemC: '#9CC8EE',
  itemHi: 'rgba(255,255,255,0.7)',
};

// Perspective mapping between the back wall and the cavity opening.
const CX = C.x + C.w / 2;
const CY = C.y + C.h / 2;
const kY = C.h / BW.h;
const frontY = (yBack: number) => CY + (yBack - CY) * kY;

const SHELVES = [150, 262, 335];

/** Soft left highlight + right shade on an item, as two single-color overlays. */
function Shade({ id, ...r }: { id: string; x: number; y: number; width: number; height: number; rx: number }) {
  return (
    <>
      <Rect {...r} fill={`url(#${id}itemHi)`} />
      <Rect {...r} fill={`url(#${id}itemLo)`} />
    </>
  );
}

/** Sparse, soft items so the cavity stays calm. */
function Items({ p, id }: { p: Palette; id: string }) {
    const sY = (SHELVES[1] + frontY(SHELVES[1])) / 2 + 6; // standing line on shelf 2
    const sY3 = (SHELVES[2] + frontY(SHELVES[2])) / 2 + 6;
    const sY1 = (SHELVES[0] + frontY(SHELVES[0])) / 2 + 6;
    return (
      <>
        {/* shelf 2: bottles + carton */}
        <Rect x={70} y={sY - 62} width={20} height={62} rx={8} fill={p.itemA} />
        <Rect x={76} y={sY - 74} width={8} height={14} rx={3} fill={p.itemC} />
        <Shade x={70} y={sY - 62} width={20} height={62} rx={8} id={id} />
        <Rect x={98} y={sY - 50} width={24} height={50} rx={5} fill={p.itemB} />
        <Shade x={98} y={sY - 50} width={24} height={50} rx={5} id={id} />
        <Rect x={132} y={sY - 40} width={22} height={40} rx={9} fill={p.itemC} />
        <Shade x={132} y={sY - 40} width={22} height={40} rx={9} id={id} />
        <Rect x={160} y={sY - 56} width={18} height={56} rx={8} fill={p.itemA} />
        <Shade x={160} y={sY - 56} width={18} height={56} rx={8} id={id} />
        <Rect x={73} y={sY - 56} width={3} height={36} rx={1.5} fill={p.itemHi} />
        {/* shelf 3: crisper boxes */}
        <Rect x={64} y={sY3 - 34} width={64} height={34} rx={7} fill={p.itemB} opacity={0.9} />
        <Rect x={134} y={sY3 - 34} width={58} height={34} rx={7} fill={p.itemC} opacity={0.9} />
        <Shade x={64} y={sY3 - 34} width={128} height={34} rx={7} id={id} />
        <Rect x={68} y={sY3 - 31} width={20} height={2.4} rx={1.2} fill={p.itemHi} />
        {/* shelf 1: a couple of jars peeking over the lip */}
        <Rect x={92} y={sY1 - 24} width={22} height={24} rx={6} fill={p.itemA} opacity={0.95} />
        <Rect x={128} y={sY1 - 30} width={26} height={30} rx={6} fill={p.itemB} opacity={0.95} />
        <Shade x={92} y={sY1 - 24} width={62} height={24} rx={6} id={id} />
      </>
    );
}

function Scene({ p, id, lit }: { p: Palette; id: string; lit: boolean }) {
  const bwR = BW.x + BW.w;
  const bwB = BW.y + BW.h;
  const cR = C.x + C.w;
  const cB = C.y + C.h;

  return (
    <>
      <Defs>
        <ClipPath id={`${id}clip`}>
          <Rect x={C.x} y={C.y} width={C.w} height={C.h} rx={C.r} />
        </ClipPath>
        <LinearGradient id={`${id}back`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={p.back0} />
          <Stop offset="1" stopColor={p.back1} />
        </LinearGradient>
        <LinearGradient id={`${id}wl`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={p.wallL0} />
          <Stop offset="1" stopColor={p.wallL1} />
        </LinearGradient>
        <LinearGradient id={`${id}wr`} x1="1" y1="0" x2="0" y2="0">
          <Stop offset="0" stopColor={p.wallR0} />
          <Stop offset="1" stopColor={p.wallR1} />
        </LinearGradient>
        <LinearGradient id={`${id}ceil`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={p.ceil0} />
          <Stop offset="1" stopColor={p.ceil1} />
        </LinearGradient>
        <LinearGradient id={`${id}floor`} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={p.floor0} />
          <Stop offset="1" stopColor={p.floor1} />
        </LinearGradient>
        {/* single-color overlays (see FridgeBody note on alpha-gradient haze) */}
        <LinearGradient id={`${id}itemHi`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#fff" stopOpacity={lit ? 0.5 : 0.1} />
          <Stop offset="0.3" stopColor="#fff" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id={`${id}itemLo`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000" stopOpacity={lit ? 0.22 : 0.4} />
        </LinearGradient>
        <RadialGradient id={`${id}vig`} cx="50%" cy="46%" r="62%">
          <Stop offset="0.55" stopColor="#06182E" stopOpacity="0" />
          <Stop offset="1" stopColor="#06182E" stopOpacity={lit ? 0.5 : 0.7} />
        </RadialGradient>
        <RadialGradient id={`${id}bloom`} cx="50%" cy="8%" r="75%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={lit ? 0.85 : 0} />
          <Stop offset="0.5" stopColor="#CFEAFF" stopOpacity={lit ? 0.22 : 0} />
          <Stop offset="1" stopColor="#CFEAFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <G clipPath={`url(#${id}clip)`}>
        {/* Back wall + four perspective walls */}
        <Rect x={BW.x} y={BW.y} width={BW.w} height={BW.h} fill={`url(#${id}back)`} />
        <Path d={`M ${C.x} ${C.y} L ${BW.x} ${BW.y} L ${BW.x} ${bwB} L ${C.x} ${cB} Z`} fill={`url(#${id}wl)`} />
        <Path d={`M ${cR} ${C.y} L ${bwR} ${BW.y} L ${bwR} ${bwB} L ${cR} ${cB} Z`} fill={`url(#${id}wr)`} />
        <Path d={`M ${C.x} ${C.y} L ${cR} ${C.y} L ${bwR} ${BW.y} L ${BW.x} ${BW.y} Z`} fill={`url(#${id}ceil)`} />
        <Path d={`M ${C.x} ${cB} L ${cR} ${cB} L ${bwR} ${bwB} L ${BW.x} ${bwB} Z`} fill={`url(#${id}floor)`} />

        {/* Corner seams where walls meet */}
        <Path
          d={`M ${BW.x} ${BW.y} L ${BW.x} ${bwB} L ${bwR} ${bwB} L ${bwR} ${BW.y} Z`}
          fill="none"
          stroke="#000"
          strokeOpacity={lit ? 0.18 : 0.5}
          strokeWidth={1.2}
        />

        {/* LED strip on the ceiling */}
        {lit && (
          <Rect x={BW.x + 18} y={C.y + 6} width={BW.w - 36} height={4} rx={2} fill="#FFFFFF" opacity={0.95} />
        )}

        {/* Glass shelves */}
        {SHELVES.map((yb, i) => {
          const yf = frontY(yb);
          const thick = 5;
          return (
            <G key={i}>
              <Path
                d={`M ${BW.x} ${yb} L ${bwR} ${yb} L ${cR} ${yf} L ${C.x} ${yf} Z`}
                fill={p.shelfTop}
              />
              <Path
                d={`M ${BW.x} ${yb} L ${bwR} ${yb}`}
                stroke={p.shelfEdge}
                strokeOpacity={0.55}
                strokeWidth={1}
              />
              <Rect x={C.x} y={yf} width={C.w} height={thick} fill={p.shelfLip} />
              <Rect x={C.x} y={yf} width={C.w} height={1.2} fill={p.shelfEdge} opacity={0.9} />
              <Rect x={C.x} y={yf + thick} width={C.w} height={9} fill="#000" opacity={lit ? 0.1 : 0.28} />
            </G>
          );
        })}

        <Items p={p} id={id} />

        {/* Bloom from the ceiling light + vignette for depth */}
        <Rect x={C.x} y={C.y} width={C.w} height={C.h} fill={`url(#${id}bloom)`} />
        <Rect x={C.x} y={C.y} width={C.w} height={C.h} fill={`url(#${id}vig)`} />
      </G>

      {/* opening lip */}
      <Rect
        x={C.x}
        y={C.y}
        width={C.w}
        height={C.h}
        rx={C.r}
        fill="none"
        stroke="#000"
        strokeOpacity={0.55}
        strokeWidth={1.4}
      />
    </>
  );
}

interface Props {
  width: number;
  /** 0..1 — interior illumination */
  light: AnimValue;
}

export const FridgeInterior = memo(function FridgeInterior({ width, light }: Props) {
  const s = width / VB_W;
  const uid = useUid('in');
  const litStyle = useAnimatedStyle(() => ({ opacity: light.value }));
  const common = { width, height: VB_H * s, viewBox: `0 0 ${VB_W} ${VB_H}` };

  return (
    <>
      <Svg pointerEvents="none" {...common} style={StyleSheet.absoluteFill}>
        <Scene p={DARK} id={`${uid}d`} lit={false} />
      </Svg>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, litStyle]}>
        <Svg {...common}>
          <Scene p={LIT} id={`${uid}l`} lit />
        </Svg>
      </Animated.View>
    </>
  );
});
