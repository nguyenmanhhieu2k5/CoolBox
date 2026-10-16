import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText, Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Timer, Zap } from 'lucide-react-native';
import { colors, fontFamily, radius, shadow, type } from '../theme';
import { useCoolBox } from '../state/useCoolBox';
import { PressableScale } from '../components/ui/PressableScale';
import { Group, IconBadge, ScreenHeader, StatText } from '../components/ui/kit';
import { RollingNumber } from '../components/ui/RollingNumber';
import { Motion } from '../motion';
import { Page } from './Page';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Metric = 'temp' | 'power' | 'time';
type Range = '24h' | '7d' | '30d';

const METRICS: { key: Metric; label: string }[] = [
  { key: 'temp', label: 'Nhiệt độ' },
  { key: 'power', label: 'Công suất' },
  { key: 'time', label: 'Thời gian' },
];
const RANGES: { key: Range; label: string }[] = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
];

/** Deterministic pseudo-random so the chart is stable between renders. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function series(metric: Metric, range: Range, current: number): number[] {
  const n = range === '24h' ? 48 : range === '7d' ? 56 : 60;
  const r = rng(metric.length * 97 + range.length * 31 + 7);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    if (metric === 'temp') {
      out.push(10.4 + Math.sin(t * Math.PI * 4.2) * 0.9 + Math.sin(t * 19) * 0.25 + (r() - 0.5) * 0.35);
    } else if (metric === 'power') {
      out.push(Math.min(96, Math.max(30, 66 + Math.sin(t * Math.PI * 3.1 + 1) * 14 + (r() - 0.5) * 12)));
    } else {
      out.push(range === '24h' ? 8 + r() * 30 : 120 + r() * 220);
    }
  }
  if (metric === 'temp' && range === '24h') out[n - 1] = current;
  return out;
}

const SUMMARY: Record<Range, { cool: string; kwh: string }> = {
  '24h': { cool: '2 giờ 41 phút', kwh: '0.72 kWh' },
  '7d': { cool: '18 giờ 20 phút', kwh: '5.10 kWh' },
  '30d': { cool: '79 giờ 05 phút', kwh: '21.8 kWh' },
};

const X_LABELS: Record<Range, string[]> = {
  '24h': ['00:00', '06:00', '12:00', '18:00', '24:00'],
  '7d': ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  '30d': ['1', '8', '15', '22', '30'],
};

export function StatisticsScreen({ active }: { active: boolean }) {
  const current = useCoolBox((s) => s.currentTemperature);
  const [metric, setMetric] = useState<Metric>('temp');
  const [range, setRange] = useState<Range>('24h');
  const [chartW, setChartW] = useState(320);

  const roundedCurrent = Math.round(current * 10) / 10;
  const data = useMemo(() => series(metric, range, roundedCurrent), [metric, range, roundedCurrent]);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const avg = data.reduce((a, b) => a + b, 0) / data.length;

  const progress = useSharedValue(0);
  useEffect(() => {
    if (!active) return;
    // the line is drawn left → right like data being revealed, not faded in
    progress.value = 0;
    progress.value = withDelay(180, withTiming(1, { duration: 1300, easing: Easing.bezier(0.4, 0, 0.2, 1) }));
  }, [active, metric, range]);

  // The current temperature flies up from the Home hero position into this header.
  const chipP = useSharedValue(0);
  useEffect(() => {
    if (!active) return;
    chipP.value = 0;
    chipP.value = withSpring(1, Motion.spring.heavy);
  }, [active]);
  const chip = useAnimatedStyle(() => ({
    opacity: Math.min(1, chipP.value * 2.2),
    transform: [{ translateX: (1 - chipP.value) * -60 }, { translateY: (1 - chipP.value) * 170 }, { scale: 1 + (1 - chipP.value) * 1.2 }],
  }));

  const unit = metric === 'temp' ? '°C' : metric === 'power' ? '%' : ' phút';
  const fmt = (v: number) => (metric === 'temp' ? v.toFixed(1) : Math.round(v).toString());
  const labels =
    metric === 'time'
      ? [ ['Tổng', Math.round(data.reduce((a, b) => a + b, 0)) + ' phút'], ['Trung bình', fmt(avg) + ' phút'], ['Cao nhất', fmt(max) + ' phút'] ]
      : [ ['Trung bình', fmt(avg) + unit], ['Thấp nhất', fmt(min) + unit], ['Cao nhất', fmt(max) + unit] ];

  return (
    <Page>
      <ScreenHeader
        title="Thống kê"
        large
        right={
          <Animated.View style={[{ flexDirection: 'row', alignItems: 'baseline', backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, ...shadow.soft }, chip]}>
            <RollingNumber
              value={current}
              textStyle={{ ...type.heading, fontSize: 17, fontWeight: '700', color: colors.primary, letterSpacing: -0.3 }}
              suffix={<Text style={{ ...type.caption, color: colors.primary, marginLeft: 1, lineHeight: 19 }}>°C</Text>}
            />
          </Animated.View>
        }
      />

      <Segmented items={METRICS} value={metric} onChange={setMetric} />

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        {RANGES.map((r) => (
          <PressableScale
            key={r.key}
            onPress={() => setRange(r.key)}
            pressedScale={0.94}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: radius.pill,
              backgroundColor: range === r.key ? colors.text : 'transparent',
            }}
          >
            <Text style={{ ...type.caption, fontWeight: '600', color: range === r.key ? '#fff' : colors.secondary }}>{r.label}</Text>
          </PressableScale>
        ))}
      </View>

      <View
        style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginTop: 14, ...shadow.soft }}
        onLayout={(e: LayoutChangeEvent) => setChartW(e.nativeEvent.layout.width - 32)}
      >
        <Text style={type.caption}>
          {metric === 'temp' ? 'Nhiệt độ (°C)' : metric === 'power' ? 'Công suất làm lạnh (%)' : 'Thời gian làm lạnh (phút)'}
        </Text>
        <Chart data={data} metric={metric} range={range} width={chartW} progress={progress} />
      </View>

      <View style={{ flexDirection: 'row', marginTop: 20, paddingHorizontal: 6 }}>
        {labels.map(([l, v]) => (
          <StatText key={l} label={l} value={v} />
        ))}
      </View>

      <Group style={{ marginTop: 20 }}>
        <MetricRow icon={Timer} title="Thời gian làm lạnh" value={SUMMARY[range].cool} />
        <MetricRow icon={Zap} title="Điện năng tiêu thụ" value={SUMMARY[range].kwh} last />
      </Group>
    </Page>
  );
}

function MetricRow({ icon, title, value, last }: { icon: typeof Timer; title: string; value: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      <IconBadge icon={icon} />
      <Text style={[type.caption, { flex: 1, marginLeft: 14 }]}>{title}</Text>
      <Text style={{ ...type.heading, fontSize: 17, fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );
}

function Segmented<T extends string>({ items, value, onChange }: { items: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const [w, setW] = useState(0);
  const idx = items.findIndex((i) => i.key === value);
  const pos = useSharedValue(idx);
  useEffect(() => {
    pos.value = withSpring(idx, { damping: 20, stiffness: 220 });
  }, [idx]);
  const itemW = (w - 8) / items.length;
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: pos.value * itemW }] }));
  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', backgroundColor: '#E9EDF3', borderRadius: radius.pill, padding: 4 }}
    >
      {w > 0 ? (
        <Animated.View style={[{ position: 'absolute', left: 4, top: 4, bottom: 4, width: itemW, borderRadius: radius.pill, backgroundColor: colors.surface, ...shadow.soft }, pill]} />
      ) : null}
      {items.map((it) => (
        <PressableScale key={it.key} onPress={() => onChange(it.key)} pressedScale={0.97} style={{ flex: 1, alignItems: 'center', paddingVertical: 9 }}>
          <Text style={{ fontFamily, fontSize: 14, fontWeight: '600', color: it.key === value ? colors.primary : colors.secondary }}>{it.label}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

function Chart({ data, metric, range, width, progress }: {
  data: number[];
  metric: Metric;
  range: Range;
  width: number;
  progress: { value: number };
}) {
  const H = 210;
  const padL = 30;
  const padB = 24;
  const padT = 14;
  const plotW = Math.max(40, width - padL - 4);
  const plotH = H - padB - padT;

  const lo0 = metric === 'time' ? 0 : Math.min(...data);
  const hi0 = Math.max(...data);
  const span = Math.max(1, hi0 - lo0);
  const step = metric === 'temp' ? 2 : metric === 'power' ? 20 : range === '24h' ? 10 : 100;
  const lo = metric === 'time' ? 0 : Math.floor((lo0 - span * 0.1) / step) * step;
  const hi = Math.ceil((hi0 + span * 0.1) / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 0.001; v += step) ticks.push(v);

  const x = (i: number) => padL + (i / (data.length - 1)) * plotW;
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * plotH;

  let line = '';
  data.forEach((v, i) => {
    if (i === 0) line += `M ${x(0)} ${y(v)}`;
    else {
      const px = x(i - 1);
      const cx = (px + x(i)) / 2;
      line += ` C ${cx} ${y(data[i - 1])} ${cx} ${y(v)} ${x(i)} ${y(v)}`;
    }
  });
  const area = `${line} L ${x(data.length - 1)} ${padT + plotH} L ${x(0)} ${padT + plotH} Z`;

  const clipProps = useAnimatedProps(() => ({ width: (width + 8) * progress.value }));
  // Leading edge of the line: a dot that rides the curve while it is being drawn.
  const nPts = data.length;
  const tipOuter = useAnimatedProps(() => {
    const f = progress.value;
    const k = f * (nPts - 1);
    const i0 = Math.min(nPts - 2, Math.floor(k));
    const v = data[i0] + (data[i0 + 1] - data[i0]) * (k - i0);
    return { cx: padL + f * plotW, cy: padT + (1 - (v - lo) / (hi - lo)) * plotH, opacity: f > 0.01 ? 0.18 : 0 };
  });
  const tipInner = useAnimatedProps(() => {
    const f = progress.value;
    const k = f * (nPts - 1);
    const i0 = Math.min(nPts - 2, Math.floor(k));
    const v = data[i0] + (data[i0 + 1] - data[i0]) * (k - i0);
    return { cx: padL + f * plotW, cy: padT + (1 - (v - lo) / (hi - lo)) * plotH, opacity: f > 0.01 ? 1 : 0 };
  });
  const markerIdx = useMemo(() => {
    const out: number[] = [];
    const stepM = Math.max(1, Math.floor((nPts - 1) / 7));
    for (let i = stepM; i < nPts - 1; i += stepM) out.push(i);
    return out;
  }, [nPts]);
  const xl = X_LABELS[range];
  const barW = Math.max(2, (plotW / data.length) * 0.62);

  return (
    <Svg width={width} height={H} style={{ marginTop: 8 }}>
      <Defs>
        <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.primary} stopOpacity="0.22" />
          <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
        </LinearGradient>
        <ClipPath id="reveal">
          <AnimatedRect x={0} y={0} height={H} animatedProps={clipProps} />
        </ClipPath>
      </Defs>

      {ticks.map((t) => (
        <G key={t}>
          <Line x1={padL} x2={padL + plotW} y1={y(t)} y2={y(t)} stroke={colors.border} strokeWidth={1} strokeDasharray="3 5" />
          <SvgText x={padL - 8} y={y(t) + 4} fontSize={11} fill={colors.secondary} textAnchor="end" fontFamily={fontFamily}>
            {t}
          </SvgText>
        </G>
      ))}

      <G clipPath="url(#reveal)">
        {metric === 'time' ? (
          data.map((v, i) => (
            <Rect key={i} x={x(i) - barW / 2} y={y(v)} width={barW} height={padT + plotH - y(v)} rx={Math.min(4, barW / 2)} fill={colors.primary} opacity={0.35 + (v / hi) * 0.65} />
          ))
        ) : (
          <>
            <Path d={area} fill="url(#areaGrad)" />
            <Path d={line} fill="none" stroke={colors.primary} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </G>

      {metric !== 'time' ? (
        <>
          {markerIdx.map((i) => (
            <Marker key={i} cx={x(i)} cy={y(data[i])} at={i / (nPts - 1)} progress={progress} />
          ))}
          <AnimatedCircle r={10} fill={colors.primary} animatedProps={tipOuter} />
          <AnimatedCircle r={4.8} fill="#fff" stroke={colors.primary} strokeWidth={2.4} animatedProps={tipInner} />
        </>
      ) : null}

      {xl.map((t, i) => (
        <SvgText
          key={t + i}
          x={padL + (i / (xl.length - 1)) * plotW}
          y={H - 5}
          fontSize={11}
          fill={colors.secondary}
          textAnchor={i === 0 ? 'start' : i === xl.length - 1 ? 'end' : 'middle'}
          fontFamily={fontFamily}
        >
          {t}
        </SvgText>
      ))}
    </Svg>
  );
}

/** A sample point that pops into place the moment the line passes it. */
function Marker({ cx, cy, at, progress }: { cx: number; cy: number; at: number; progress: { value: number } }) {
  const props = useAnimatedProps(() => {
    const t = Math.min(1, Math.max(0, (progress.value - at) * 14));
    return { r: 3.2 * t, opacity: t };
  });
  return <AnimatedCircle cx={cx} cy={cy} fill="#fff" stroke={colors.primary} strokeWidth={1.8} animatedProps={props} />;
}
