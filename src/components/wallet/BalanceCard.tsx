import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { formatRupiah } from '@/lib/format';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export function BalanceCard({
  balance,
  limit,
  onTopup,
  onHistory,
}: {
  balance: number;
  limit?: number;
  onTopup: () => void;
  onHistory: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name="wallet-outline"
            size={17}
            color={colors.coral}
          />
        </View>
        <AppText variant="labelSmall" style={styles.label}>
          SALDO AKTIF
        </AppText>
        <View style={styles.liveDot} />
      </View>

      <AppText style={styles.amount}>{formatRupiah(balance)}</AppText>
      <AppText style={styles.limit}>
        Batas saldo {formatRupiah(limit ?? 1000000)}
      </AppText>

      <View style={styles.actions}>
        <Pressable
          onPress={onTopup}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primaryAction,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="plus" size={17} color={colors.ink} />
          <AppText style={styles.primaryLabel}>Top up</AppText>
        </Pressable>
        <Pressable
          onPress={onHistory}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.secondaryAction,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="history"
            size={17}
            color={colors.paper}
          />
          <AppText style={styles.secondaryLabel}>Riwayat</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    padding: spacing.base,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(232, 107, 79, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#B9C3CA',
    letterSpacing: 1.4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.teal,
    marginLeft: 'auto',
  },
  amount: {
    color: colors.paper,
    fontFamily: fonts.monoMedium,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  limit: {
    color: '#9AA7B0',
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  primaryAction: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    backgroundColor: colors.coral,
  },
  secondaryAction: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 241, 233, 0.24)',
  },
  pressed: {
    opacity: 0.75,
  },
  primaryLabel: {
    color: colors.ink,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  secondaryLabel: {
    color: colors.paper,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
});
