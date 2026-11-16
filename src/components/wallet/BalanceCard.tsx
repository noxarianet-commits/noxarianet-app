import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { formatRupiah } from '@/lib/format';
import { fonts, radius, spacing } from '@/theme/tokens';

const BALANCE_VISIBILITY_KEY = 'noxarianet.balance.visible';

export function BalanceCard({
  balance,
  limit,
  onTopup,
  onHistory,
  style,
}: {
  balance: number;
  limit?: number;
  onTopup: () => void;
  onHistory: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const [visible, setVisible] = useState(true);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.25,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [blinkAnim]);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(BALANCE_VISIBILITY_KEY)
      .then((val) => {
        if (mounted && val !== null) {
          setVisible(val === 'true');
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const toggleVisibility = () => {
    setVisible((prev) => {
      const next = !prev;
      AsyncStorage.setItem(BALANCE_VISIBILITY_KEY, String(next)).catch(() => {});
      return next;
    });
  };

  return (
    <View style={[styles.cardContainer, style]}>
      {/* Subtle clean ambient background glow */}
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      {/* Top Header: Brand Name & Status */}
      <View style={styles.topRow}>
        <View style={styles.brandWrap}>
          <AppText style={styles.brandTitle} numberOfLines={1}>
            Saldo Noxarianet
          </AppText>
        </View>

        <View style={styles.statusPill}>
          <Animated.View style={[styles.liveDot, { opacity: blinkAnim }]} />
          <AppText style={styles.statusText}>SALDO AKTIF</AppText>
        </View>
      </View>

      {/* Middle Section: Saldo & Batas Saldo */}
      <View style={styles.balanceSection}>
        <View style={styles.amountRow}>
          <AppText style={styles.amountText} numberOfLines={1} adjustsFontSizeToFit>
            {visible ? formatRupiah(balance) : 'Rp ••••••'}
          </AppText>

          <Pressable
            onPress={toggleVisibility}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Sembunyikan saldo' : 'Tampilkan saldo'}
            hitSlop={10}
            style={({ pressed }) => [
              styles.eyeButton,
              pressed && styles.eyePressed,
            ]}
          >
            <MaterialCommunityIcons
              name={visible ? 'eye-outline' : 'eye-off-outline'}
              size={15}
              color="rgba(255, 255, 255, 0.9)"
            />
          </Pressable>
        </View>

        <AppText style={styles.limitText} numberOfLines={1}>
          Batas saldo {visible ? formatRupiah(limit ?? 1000000) : 'Rp ••••••'}
        </AppText>
      </View>

      {/* Bottom Actions: Top up & Riwayat */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={onTopup}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#4D1B8C" />
          <AppText style={styles.primaryButtonText} numberOfLines={1}>
            Top up
          </AppText>
        </Pressable>

        <Pressable
          onPress={onHistory}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="history" size={17} color="#FFFFFF" />
          <AppText style={styles.secondaryButtonText} numberOfLines={1}>
            Riwayat
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#4D1B8C',
    borderRadius: 20,
    padding: spacing.base + 2,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#4D1B8C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  glowTopRight: {
    position: 'absolute',
    top: -45,
    right: -35,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -45,
    left: -35,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },

  // Top Row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  brandWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    flexShrink: 0,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
  statusText: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.8,
  },

  // Balance Section
  balanceSection: {
    marginTop: spacing.sm + 2,
    marginBottom: spacing.sm + 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  amountText: {
    flexShrink: 1,
    minWidth: 0,
    color: '#FFFFFF',
    fontFamily: fonts.monoMedium,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  eyeButton: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  eyePressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  limitText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  pressed: {
    opacity: 0.8,
  },
  primaryButtonText: {
    color: '#4D1B8C',
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
});
