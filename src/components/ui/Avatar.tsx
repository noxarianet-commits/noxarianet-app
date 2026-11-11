import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius } from '@/theme/tokens';

export function Avatar({
  name,
  size = 44,
}: {
  name?: string | null;
  size?: number;
}) {
  const initials =
    String(name || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'N';

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: radius.pill },
      ]}
    >
      <AppText
        style={{
          color: colors.coralInk,
          fontFamily: fonts.bold,
          fontSize: size * 0.36,
        }}
      >
        {initials}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
