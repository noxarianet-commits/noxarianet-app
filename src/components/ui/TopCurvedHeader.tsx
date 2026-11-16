import { StatusBar } from 'expo-status-bar';
import React, { type ReactNode } from 'react';
import { Platform, StatusBar as RNStatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, layout, radius, spacing } from '@/theme/tokens';

type Props = {
  title: string;
  badge?: string | number | null;
  subtitle?: string;
  right?: ReactNode;
};

/**
 * Header ungu solid khas Noxarianet (#4D1B8C) yang mengisi penuh hingga ke tepi atas layar (status bar),
 * dengan bagian bawah melengkung halus (cekungan 28px) persis seperti di Beranda.
 * Teks judul dan badge menggunakan warna putih terang (#FFFFFF) agar kontras dan sangat jelas dibaca.
 */
export function TopCurvedHeader({ title, badge, subtitle, right }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0,
  );

  return (
    <View style={[styles.header, { paddingTop: topInset + 8 }]}>
      <StatusBar style="light" />
      <View style={styles.titleRow}>
        <View style={styles.leftCol}>
          <View style={styles.nameRow}>
            <AppText
              variant="titleMedium"
              style={styles.titleText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {title}
            </AppText>
            {badge !== undefined && badge !== null && (
              <View style={styles.badge}>
                <AppText variant="labelSmall" style={styles.badgeText} numberOfLines={1}>
                  {badge}
                </AppText>
              </View>
            )}
          </View>
          {subtitle ? (
            <AppText
              variant="bodySmall"
              style={styles.subtitleText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>

        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.coral, // #4D1B8C (Ungu resmi Noxarianet sama persis dengan Beranda)
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: colors.coralDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  leftCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  titleText: {
    fontFamily: fonts.bold,
    fontSize: 17, // Disesuaikan lebih ramping agar sangat responsif pada nama kategori/judul panjang
    lineHeight: 23,
    color: '#FFFFFF', // Teks putih terang dan jelas di atas background ungu
    flexShrink: 1, // Memastikan judul panjang mengecil/menyesuaikan dan tidak memotong badge
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    flexShrink: 0, // Badge tetap utuh dan tidak terpotong di tepi kanan
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    color: '#FFFFFF',
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
  },
  right: {
    flexShrink: 0,
    marginLeft: spacing.sm,
  },
});
