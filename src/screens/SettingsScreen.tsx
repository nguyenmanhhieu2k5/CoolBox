import React from 'react';
import { Text, View } from 'react-native';
import { Bell, ChevronRight, Info, Lock, Share2, SlidersHorizontal, User, Wifi } from 'lucide-react-native';
import { colors, radius, shadow, type } from '../theme';
import { useNav } from '../navigation/NavContext';
import { useCoolBox } from '../state/useCoolBox';
import { PressableScale } from '../components/ui/PressableScale';
import { Group, Row, ScreenHeader, SectionLabel } from '../components/ui/kit';
import { MiniFridge } from '../components/MiniFridge';
import { Page } from './Page';

const MODE_LABEL = { auto: 'Tự động', fast: 'Làm lạnh nhanh', eco: 'Tiết kiệm điện' } as const;

export function SettingsScreen() {
  const { push } = useNav();
  const wifi = useCoolBox((s) => s.wifiConnected);
  const mode = useCoolBox((s) => s.selectedMode);
  const unread = useCoolBox((s) => s.notifications.filter((n) => !n.read).length);

  return (
    <Page>
      <ScreenHeader title="Cài đặt" large />

      <PressableScale onPress={() => push('device')} pressedScale={0.98} accessibilityLabel="Thông tin thiết bị">
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, marginTop: 8, ...shadow.soft }}>
          <MiniFridge height={78} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={type.heading}>CoolBox</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: wifi ? colors.success : colors.danger }} />
              <Text style={type.caption}>{wifi ? 'Đã kết nối' : 'Mất kết nối'}</Text>
            </View>
            <Text style={[type.caption, { marginTop: 3, fontSize: 12 }]}>ESP32 • v1.0.0</Text>
          </View>
          <ChevronRight size={20} color="#B4BCC9" strokeWidth={2.2} />
        </View>
      </PressableScale>

      <SectionLabel>THIẾT BỊ</SectionLabel>
      <Group>
        <Row icon={Info} title="Thông tin thiết bị" value="CB-001" chevron onPress={() => push('device')} />
        <Row icon={Wifi} title="Wi-Fi" value={wifi ? 'Đã kết nối' : 'Mất kết nối'} last />
      </Group>

      <SectionLabel>ĐIỀU KHIỂN</SectionLabel>
      <Group>
        <Row icon={SlidersHorizontal} title="Chế độ hoạt động" value={MODE_LABEL[mode]} chevron onPress={() => push('mode')} />
        <Row icon={Bell} title="Thông báo" value={unread ? `${unread} mới` : undefined} chevron onPress={() => push('notifications')} />
        <Row icon={Lock} title="Bảo mật" chevron onPress={() => push('security')} last />
      </Group>

      <SectionLabel>HỆ THỐNG</SectionLabel>
      <Group>
        <Row icon={User} title="Hồ sơ" chevron onPress={() => push('profile')} />
        <Row icon={Info} title="Giới thiệu" chevron onPress={() => push('about')} last />
      </Group>
    </Page>
  );
}
