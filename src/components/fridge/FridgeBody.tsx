import React, { memo } from 'react';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { StyleSheet } from 'react-native';
import { BODY, SIDE, VB_H, VB_W } from './geometry';
import { useUid } from './useUid';

interface Props {
  width: number;
}

/**
 * The stationary cabinet: right side face (3/4 perspective), the front rim that
 * surrounds the door opening, and the feet. None of this ever moves.
 *
 * Lighting comes from the upper-left/front-left, so the front rim is lightest at
 * the top-left, the side face falls off to near-black at the back, and the
 * bottom is a touch darker than the top.
 */
export const FridgeBody = memo(function FridgeBody({ width }: Props) {
  const s = width / VB_W;
  const uid = useUid('bd');
  const { frontX, backX } = SIDE;
  const top = BODY.y;
  const bottom = BODY.y + BODY.h;

  // Side face: converging top / bottom edges, rounded back corners. Its front edge
  // tucks underneath the rim (drawn later) so the two read as one rounded body.
  const sidePath = [
    `M ${frontX - 26} ${top + 16}`,
    `L ${frontX - 9} ${top + 9}`,
    `L ${backX - 8} ${top + 12.5}`,
    `Q ${backX} ${top + 13.5} ${backX} ${top + 22}`,
    `L ${backX} ${bottom - 23}`,
    `Q ${backX} ${bottom - 13.5} ${backX - 8} ${bottom - 12}`,
    `L ${frontX - 9} ${bottom - 7}`,
    `L ${frontX - 26} ${bottom - 14}`,
    'Z',
  ].join(' ');

  return (
    <Svg
      pointerEvents="none"
      width={width}
      height={VB_H * s}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <LinearGradient id={`${uid}side`} x1="0" y1="0" x2="1" y2="0.08">
          <Stop offset="0" stopColor="#262B34" />
          <Stop offset="0.35" stopColor="#1B1F27" />
          <Stop offset="1" stopColor="#0C0F14" />
        </LinearGradient>
        {/* NOTE: never mix colors inside one alpha gradient — SVG interpolates
            non-premultiplied, so white→black through alpha 0 leaves a gray haze.
            Highlight and shade are separate single-color overlays. */}
        <LinearGradient id={`${uid}sideHi`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.07" />
          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id={`${uid}sideLo`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.45" stopColor="#000000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.38" />
        </LinearGradient>
        <LinearGradient id={`${uid}sideEdge`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <Stop offset="0.12" stopColor="#000" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id={`${uid}rim`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#363C48" />
          <Stop offset="0.45" stopColor="#1D2129" />
          <Stop offset="1" stopColor="#101319" />
        </LinearGradient>
        <LinearGradient id={`${uid}top`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
          <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0.14" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id={`${uid}foot`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2A2F38" />
          <Stop offset="1" stopColor="#07090C" />
        </LinearGradient>
      </Defs>

      {/* Feet (behind the cabinet so the body overlaps their tops) */}
      <Rect x={36} y={398} width={30} height={19} rx={6} fill={`url(#${uid}foot)`} />
      <Rect x={200} y={400} width={30} height={19} rx={6} fill={`url(#${uid}foot)`} />
      <Rect x={246} y={390} width={20} height={14} rx={5} fill="#06080B" opacity={0.85} />
      <Rect x={38} y={399} width={9} height={2} rx={1} fill="#fff" opacity={0.12} />

      {/* Right side face */}
      <Path d={sidePath} fill={`url(#${uid}side)`} />
      <Path d={sidePath} fill={`url(#${uid}sideHi)`} />
      <Path d={sidePath} fill={`url(#${uid}sideLo)`} />
      <Path d={sidePath} fill={`url(#${uid}sideEdge)`} />
      {/* faint panel seam on the side, as in the reference */}
      <Path
        d={`M ${frontX + 2} 262 L ${backX - 1} 255`}
        stroke="#000"
        strokeOpacity={0.22}
        strokeWidth={0.9}
        fill="none"
      />
      {/* top rim highlight catching the light */}
      <Path
        d={`M ${frontX + 4} ${top + 1.2} L ${backX - 8} ${top + 10}`}
        stroke={`url(#${uid}top)`}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
      />

      {/* Front rim around the door opening */}
      <G>
        <Rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} rx={BODY.r} fill={`url(#${uid}rim)`} />
        <Rect
          x={BODY.x + 0.6}
          y={BODY.y + 0.6}
          width={BODY.w - 1.2}
          height={BODY.h - 1.2}
          rx={BODY.r - 0.6}
          fill="none"
          stroke="#fff"
          strokeOpacity={0.14}
          strokeWidth={1}
        />
      </G>
    </Svg>
  );
});
