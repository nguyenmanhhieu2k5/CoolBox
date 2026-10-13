import React from 'react';
import { Text, View } from 'react-native';
import { FileText, LogOut, MessageCircle, Pencil, Share2, User } from 'lucide-react-native';
import { colors, type } from '../theme';
import { useNav } from '../navigation/NavContext';
import { Group, Row, ScreenHeader, SectionLabel } from '../components/ui/kit';
import { Page } from './Page';

export function ProfileScreen() {
  const { pop } = useNav();
  return (
    <Page>
      <ScreenHeader title="Hồ sơ" onBack={pop} />
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <User size={40} color={colors.primary} strokeWidth={1.8} />
        </View>
        <Text style={[type.title, { marginTop: 14, fontSize: 24 }]}>Hiếu</Text>
        <Text style={[type.caption, { marginTop: 2 }]}>hieumanh2k5@gmail.com</Text>
      </View>

      <SectionLabel>TÀI KHOẢN</SectionLabel>
      <Group>
        <Row icon={Pencil} title="Chỉnh sửa hồ sơ" chevron />
        <Row icon={Share2} title="Chia sẻ thiết bị" chevron last />
      </Group>

      <SectionLabel>HỖ TRỢ</SectionLabel>
      <Group>
        <Row icon={MessageCircle} title="Liên hệ hỗ trợ" chevron />
        <Row icon={FileText} title="Điều khoản sử dụng" chevron last />
      </Group>

      <Group style={{ marginTop: 24 }}>
        <Row icon={LogOut} title="Đăng xuất" tint={colors.danger} bg="#FFECEA" last />
      </Group>
    </Page>
  );
}
