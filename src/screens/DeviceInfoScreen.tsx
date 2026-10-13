import React from 'react';
import { Text, View } from 'react-native';
import { colors, radius, shadow, type } from '../theme';
import { useLayout } from '../hooks/useLayout';
import { useNav } from '../navigation/NavContext';
import { useCoolBox } from '../state/useCoolBox';
import { Group, ScreenHeader } from '../components/ui/kit';
import { CoolBoxFridge } from '../components/fridge/CoolBoxFridge';
import { VB_H, VB_W } from '../components/fridge/geometry';
import { Page } from './Page';

export function DeviceInfoScreen() {
  const l = useLayout();
  const { pop } = useNav();
  const temp = useCoolBox((s) => s.currentTemperature);
  const power = useCoolBox((s) => s.coolingPower);
  const wifi = useCoolBox((s) => s.wifiConnected);
  const fw = Math.min(150, l.columnWidth * 0.36);
  const rows: [string, string][] = [
    ['Model', 'CB-001'],
    ['Phiên bản', 'v1.0.0'],
    ['Vi điều khiển', 'ESP32'],
    ['Địa chỉ IP', '192.168.1.18'],
    ['Trạng thái', wifi ? 'Đã kết nối' : 'Mất kết nối'],
  ];
  return (
    <Page>
      <ScreenHeader title="Thông tin thiết bị" onBack={pop} />
      <View style={{ alignItems: 'center', marginVertical: 16, height: (fw * VB_H) / VB_W }}>
        <CoolBoxFridge width={fw} label="10°" />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile label="Nhiệt độ hiện tại" value={`${temp.toFixed(1)}°C`} />
        <Tile label="Công suất làm lạnh" value={`${Math.round(power)}%`} />
      </View>
      <Group style={{ marginTop: 16 }}>
        {rows.map(([k, v], i) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: i === rows.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
            <Text style={type.caption}>{k}</Text>
            <Text style={{ ...type.body, fontVariant: ['tabular-nums'] }}>{v}</Text>
          </View>
        ))}
      </Group>
    </Page>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, ...shadow.soft }}>
      <Text style={type.caption}>{label}</Text>
      <Text style={{ ...type.heading, fontSize: 22, marginTop: 4, fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );
}
