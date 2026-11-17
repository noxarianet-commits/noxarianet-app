import { Alert, Linking, StyleSheet, View } from 'react-native';

import { TextButton } from '@/components/ui/Buttons';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { colors, spacing } from '@/theme/tokens';

type Props = {
  latestVersion: string;
  downloadUrl: string;
  onDismiss: () => void;
};

export function UpdateBanner({ latestVersion, downloadUrl, onDismiss }: Props) {
  const handleUpdate = async () => {
    try {
      await Linking.openURL(downloadUrl);
    } catch {
      Alert.alert(
        'Link unduhan tidak bisa dibuka',
        'Silakan buka halaman download Noxarianet atau hubungi admin untuk mendapatkan APK terbaru.',
      );
    }
  };

  return (
    <InfoBanner
      tone="warning"
      icon="cellphone-arrow-down"
      title={`Versi ${latestVersion} tersedia`}
      message="Update aplikasi untuk mendapatkan fitur dan perbaikan terbaru."
      action={
        <View style={styles.actions}>
          <TextButton
            compact
            textColor={colors.goldInk}
            onPress={() => void handleUpdate()}
          >
            Update sekarang
          </TextButton>
          <TextButton
            compact
            textColor={colors.mutedStrong}
            onPress={onDismiss}
          >
            Nanti
          </TextButton>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -spacing.sm,
  },
});
