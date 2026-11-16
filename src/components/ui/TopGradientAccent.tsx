import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, StatusBar as RNStatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

type Props = {
  /** Tinggi tambahan lengkungan di bawah area status bar (default: 10px agar sangat tipis & minimalis) */
  curveHeight?: number;
};

/**
 * Aksen bar ungu tipis di bagian paling atas perangkat (area status bar),
 * dengan tepi bawah melengkung (cekungan lengkung) persis warna ungu Beranda (#4D1B8C).
 * Tetap menjaga halaman bertema bersih/terang dan TIDAK membuat halaman full ungu.
 */
export function TopCurvedAccent({ curveHeight = 10 }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0,
  );

  return (
    <View pointerEvents="none" style={styles.container}>
      <StatusBar style="light" />
      <View
        style={[
          styles.curvedBar,
          {
            height: topInset + curveHeight,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  curvedBar: {
    width: '100%',
    backgroundColor: colors.coral, // #4D1B8C warna ungu solid resmi Noxarianet (persis Beranda)
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    shadowColor: colors.coralDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
});
