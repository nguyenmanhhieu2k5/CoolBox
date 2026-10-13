import React from 'react';
import { Text, View } from 'react-native';
import { Fingerprint, Lock, ShieldCheck, Smartphone } from 'lucide-react-native';
import { colors, radius, type } from '../theme';
import { useNav } from '../navigation/NavContext';
import { setPref, usePrefs } from '../state/usePrefs';
import { Group, Row, ScreenHeader, SectionLabel } from '../components/ui/kit';
import { Page } from './Page';

export function SecurityScreen() {
  const { pop } = useNav();
  const p = usePrefs((s) => s);
  const score = [p.pin, p.biometric, p.appLock, p.deviceProtection].filter(Boolean).length;
  return (
    <Page>
      <ScreenHeader title="Bảo mật" onBack={pop} />
      <View style={{ alignItems: 'center', marginTop: 14 }}>
        <View style={{ width: 84, height: 84, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={42} color={colors.primary} strokeWidth={1.8} />
        </View>
        <Text style={[type.heading, { marginTop: 14 }]}>{score >= 3 ? 'Thiết bị được bảo vệ' : 'Có thể bảo mật tốt hơn'}</Text>
        <Text style={[type.caption, { marginTop: 4 }]}>{score}/4 lớp bảo vệ đang bật</Text>
      </View>

      <SectionLabel>ĐĂNG NHẬP</SectionLabel>
      <Group>
        <Row icon={Lock} title="Mã PIN" subtitle="Yêu cầu mã PIN khi mở ứng dụng" toggle={{ value: p.pin, onChange: (v) => setPref('pin', v) }} />
        <Row icon={Fingerprint} title="Sinh trắc học" subtitle="Vân tay hoặc khuôn mặt" toggle={{ value: p.biometric, onChange: (v) => setPref('biometric', v) }} last />
      </Group>

      <SectionLabel>BẢO VỆ</SectionLabel>
      <Group>
        <Row icon={Smartphone} title="Bảo mật ứng dụng" subtitle="Tự khóa khi chuyển sang ứng dụng khác" toggle={{ value: p.appLock, onChange: (v) => setPref('appLock', v) }} />
        <Row icon={ShieldCheck} title="Bảo vệ thiết bị" subtitle="Chặn điều khiển từ thiết bị lạ" toggle={{ value: p.deviceProtection, onChange: (v) => setPref('deviceProtection', v) }} last />
      </Group>
    </Page>
  );
}
