import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react-native';
import { colors, radius, shadow, type } from '../../theme';
import { PressableScale } from './PressableScale';
import { Toggle } from './Toggle';

export function ScreenHeader({
  title,
  onBack,
  right,
  large,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  large?: boolean;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <PressableScale onPress={onBack} style={styles.round} accessibilityLabel="Quay lại" hitSlop={8}>
          <ChevronLeft size={20} color={colors.text} strokeWidth={2.2} />
        </PressableScale>
      ) : null}
      <Text style={[large ? type.title : type.heading, { flex: 1 }, onBack && { textAlign: 'center', marginRight: 40 }]} numberOfLines={1}>
        {title}
      </Text>
      {right ? <View style={onBack ? { position: 'absolute', right: 0 } : undefined}>{right}</View> : null}
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={[type.micro, { marginTop: 24, marginBottom: 10, marginLeft: 6 }]}>{children}</Text>;
}

export function Group({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.group, style]}>{children}</View>;
}

export function IconBadge({ icon: Icon, tint = colors.primary, bg = colors.primarySoft, size = 36 }: {
  icon: LucideIcon;
  tint?: string;
  bg?: string;
  size?: number;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.34, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={size * 0.52} color={tint} strokeWidth={2} />
    </View>
  );
}

export function Row({
  icon,
  title,
  subtitle,
  value,
  onPress,
  chevron,
  toggle,
  last,
  tint,
  bg,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
  last?: boolean;
  tint?: string;
  bg?: string;
}) {
  const content = (
    <View style={[styles.row, !last && styles.rowDivider]}>
      {icon ? <IconBadge icon={icon} tint={tint} bg={bg} /> : null}
      <View style={{ flex: 1, marginLeft: icon ? 14 : 0 }}>
        <Text style={type.body}>{title}</Text>
        {subtitle ? <Text style={[type.caption, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={[type.caption, { marginRight: chevron ? 6 : 0 }]}>{value}</Text> : null}
      {toggle ? <Toggle value={toggle.value} onChange={toggle.onChange} /> : null}
      {chevron ? <ChevronRight size={18} color="#B4BCC9" strokeWidth={2.2} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <PressableScale onPress={onPress} pressedScale={0.985}>
      {content}
    </PressableScale>
  );
}

export function StatText({ label, value, style }: { label: string; value: string; style?: StyleProp<TextStyle> }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={type.caption}>{label}</Text>
      <Text style={[{ ...type.heading, fontSize: 20, marginTop: 4, fontVariant: ['tabular-nums'] }, style]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 44, marginBottom: 8 },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  group: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 16, ...shadow.soft },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, minHeight: 64 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});
