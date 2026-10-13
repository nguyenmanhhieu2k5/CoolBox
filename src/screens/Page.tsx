import React from 'react';
import { ScrollView, View } from 'react-native';
import { useLayout } from '../hooks/useLayout';

/** Shared scroll container: responsive column, safe-area padding, room for the tab bar. */
export function Page({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  const l = useLayout();
  return (
    <ScrollView
      contentContainerStyle={{
        alignItems: 'center',
        paddingTop: l.insets.top + 8,
        paddingBottom: l.insets.bottom + 110,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: wide ? l.columnWidth : Math.min(l.columnWidth, 560), paddingHorizontal: 20 }}>{children}</View>
    </ScrollView>
  );
}
