import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';

import { AppText } from '@/components/ui/AppText';
import { colors, layout } from '@/theme/tokens';

type Props = {
  title?: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  compact?: boolean;
};

export function AppHeader({
  title,
  subtitle,
  back = true,
  onBack,
  right,
  compact = false,
}: Props) {
  const handleBack =
    onBack ??
    (() => {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    });

  return (
    <View style={[styles.header, compact && styles.compact]}>
      {back ? (
        <IconButton
          icon="arrow-left"
          size={22}
          iconColor={colors.ink}
          onPress={handleBack}
          style={styles.back}
          accessibilityLabel="Kembali"
        />
      ) : null}
      <View style={styles.titleWrap}>
        {title ? (
          <AppText variant="titleLarge" numberOfLines={1}>
            {title}
          </AppText>
        ) : null}
        {subtitle ? (
          <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: layout.screenPadding,
    paddingLeft: 4,
  },
  compact: {
    minHeight: 48,
  },
  back: {
    margin: 0,
  },
  titleWrap: {
    flex: 1,
    paddingLeft: 4,
    paddingVertical: 8,
  },
  right: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
