import React from 'react';
import { Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';
import { HANDLE } from './geometry';

/**
 * Vertical, dark, rounded handle attached to the door. Rendered inside the
 * door face SVG so it is physically part of the door and moves with it.
 */
export function FridgeHandle({ uid }: { uid: string }) {
  const { x, y, w, h } = HANDLE;
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}hd`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#59606E" />
          <Stop offset="0.28" stopColor="#363C47" />
          <Stop offset="0.7" stopColor="#1B1F26" />
          <Stop offset="1" stopColor="#0D1015" />
        </LinearGradient>
        <LinearGradient id={`${uid}hdv`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <Stop offset="0.25" stopColor="#fff" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id={`${uid}hdlo`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </LinearGradient>
        <LinearGradient id={`${uid}hdcast`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#000" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#000" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {/* soft cast shadow on the door, to the right of the handle (light is from the left) */}
      <Rect x={x + w - 1} y={y + 4} width={9} height={h} rx={4.5} fill={`url(#${uid}hdcast)`} />
      {/* mounting lugs */}
      <Rect x={x - 1.5} y={y + 8} width={5} height={7} rx={2} fill="#0B0D11" opacity={0.9} />
      <Rect x={x - 1.5} y={y + h - 15} width={5} height={7} rx={2} fill="#0B0D11" opacity={0.9} />
      {/* body */}
      <Rect x={x} y={y} width={w} height={h} rx={w / 2} fill={`url(#${uid}hd)`} />
      <Rect x={x} y={y} width={w} height={h} rx={w / 2} fill={`url(#${uid}hdv)`} />
      <Rect x={x} y={y} width={w} height={h} rx={w / 2} fill={`url(#${uid}hdlo)`} />
      {/* specular edge */}
      <Rect x={x + 1.4} y={y + 6} width={1.6} height={h - 12} rx={0.8} fill="#fff" opacity={0.28} />
      <Rect
        x={x + 0.3}
        y={y + 0.3}
        width={w - 0.6}
        height={h - 0.6}
        rx={w / 2 - 0.3}
        fill="none"
        stroke="#000"
        strokeOpacity={0.4}
        strokeWidth={0.8}
      />
    </G>
  );
}
