import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/Buttons';
import { colors, spacing } from '@/theme/tokens';

export default function NotFoundScreen() {
  return (
    <View style={styles.screen}>
      <MaterialCommunityIcons
        name="map-marker-question-outline"
        size={48}
        color={colors.coralDark}
      />
      <AppText variant="headlineSmall" align="center">
        Halaman tidak ditemukan
      </AppText>
      <AppText variant="bodyMedium" color={colors.muted} align="center">
        Tautan yang kamu buka tidak tersedia di aplikasi ini.
      </AppText>
      <PrimaryButton onPress={() => router.replace('/')}>
        Kembali ke beranda
      </PrimaryButton>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
});
