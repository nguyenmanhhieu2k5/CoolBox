import React from 'react';
import { Text, View } from 'react-native';
import { Snowflake } from 'lucide-react-native';
import { colors, type } from '../theme';
import { useNav } from '../navigation/NavContext';
import { Group, ScreenHeader } from '../components/ui/kit';
import { Page } from './Page';

export function AboutScreen() {
  const { pop } = useNav();
  const rows: [string, string][] = [
    ['Phiên bản ứng dụng', '1.0.0'],
    ['Phiên bản thiết bị', 'v1.0.0'],
    ['Nhà phát triển', 'CoolBox Team'],
  ];
  return (
    <Page>
      <ScreenHeader title="Giới thiệu" onBack={pop} />
      <View style={{ alignItems: 'center', marginVertical: 28 }}>
        <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }}>
          <Snowflake size={36} color="#fff" strokeWidth={2.2} />
        </View>
        <Text style={{ ...type.title, fontSize: 32, marginTop: 14 }}>CoolBox</Text>
        <Text style={[type.caption, { marginTop: 2 }]}>Smart Mini Fridge</Text>
      </View>
      <Group>
        {rows.map(([k, v], i) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: i === rows.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
            <Text style={type.caption}>{k}</Text>
            <Text style={type.body}>{v}</Text>
          </View>
        ))}
      </Group>
      <Text style={[type.caption, { textAlign: 'center', marginTop: 28, lineHeight: 20 }]}>
        Công nghệ vì một cuộc sống{'\n'}tươi ngon hơn.
      </Text>
    </Page>
  );
}
