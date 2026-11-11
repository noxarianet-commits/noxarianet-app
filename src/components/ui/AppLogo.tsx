import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme/tokens';

type Props = {
  size?: number;
  rounded?: boolean;
};

export function AppLogo({ size = 48, rounded = false }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: rounded ? radius.md : 0,
        },
      ]}
    >
      <Image
        source={require('@/assets/images/noxarianet-logo.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
        transition={150}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
