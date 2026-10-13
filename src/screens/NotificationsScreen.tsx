import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Bell, CircleAlert, CircleCheck, Info, LucideIcon, Power, Snowflake, Wifi, WifiOff } from 'lucide-react-native';
import { colors, radius, shadow, type } from '../theme';
import { useNav } from '../navigation/NavContext';
import { actions, useCoolBox } from '../state/useCoolBox';
import type { CoolBoxNotification, NotificationKind } from '../services';
import { PressableScale } from '../components/ui/PressableScale';
import { ScreenHeader } from '../components/ui/kit';
import { Page } from './Page';

type Filter = 'all' | 'system' | 'alert';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'system', label: 'Hệ thống' },
  { key: 'alert', label: 'Cảnh báo' },
];

const ICONS: Record<NotificationKind, { icon: LucideIcon; tint: string; bg: string }> = {
  target: { icon: CircleCheck, tint: colors.primary, bg: colors.primarySoft },
  'cooling-on': { icon: Snowflake, tint: colors.primary, bg: colors.primarySoft },
  'cooling-off': { icon: Power, tint: colors.secondary, bg: '#EEF1F5' },
  'wifi-on': { icon: Wifi, tint: colors.success, bg: '#E7F7EC' },
  'wifi-off': { icon: WifiOff, tint: colors.danger, bg: '#FFECEA' },
  warm: { icon: CircleAlert, tint: colors.warning, bg: '#FFF3E0' },
  system: { icon: Info, tint: colors.primary, bg: colors.primarySoft },
};

function ago(at: number) {
  const m = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  return `${h} giờ trước`;
}

export function NotificationsScreen() {
  const { pop } = useNav();
  const all = useCoolBox((s) => s.notifications);
  const [filter, setFilter] = useState<Filter>('all');
  useEffect(() => {
    const t = setTimeout(actions.markRead, 1200); // read once the user has seen them
    return () => clearTimeout(t);
  }, []);
  const list = all.filter((n) => filter === 'all' || n.category === filter);

  return (
    <Page>
      <ScreenHeader title="Thông báo" onBack={pop} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        {FILTERS.map((f) => (
          <PressableScale
            key={f.key}
            onPress={() => setFilter(f.key)}
            pressedScale={0.94}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: filter === f.key ? colors.primary : colors.surface, ...shadow.soft }}
          >
            <Text style={{ ...type.caption, fontWeight: '600', color: filter === f.key ? '#fff' : colors.secondary }}>{f.label}</Text>
          </PressableScale>
        ))}
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, marginTop: 16, paddingHorizontal: 16, ...shadow.soft }}>
        {list.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 36 }}>
            <Bell size={28} color="#B4BCC9" />
            <Text style={[type.caption, { marginTop: 10 }]}>Không có thông báo</Text>
          </View>
        ) : (
          list.map((n, i) => <Item key={n.id} n={n} last={i === list.length - 1} />)
        )}
      </View>
    </Page>
  );
}

function Item({ n, last }: { n: CoolBoxNotification; last: boolean }) {
  const s = ICONS[n.kind];
  const Icon = s.icon;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={19} color={s.tint} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={type.body}>{n.title}</Text>
        <Text style={[type.caption, { marginTop: 2, fontSize: 12 }]}>
          {n.detail} • {ago(n.at)}
        </Text>
      </View>
      {!n.read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} /> : null}
    </View>
  );
}
