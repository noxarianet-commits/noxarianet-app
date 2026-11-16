import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tone?: 'surface' | 'paper' | 'muted' | 'glass';
}>;

export function SurfaceCard({
  children,
  style,
  padded = true,
  tone = 'surface',
}: Props) {
  return (
    <View
      style={[
        styles.card,
        tone === 'paper' && styles.paper,
        tone === 'muted' && styles.muted,
        tone === 'glass' && styles.glass,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
  },
  glass: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: 'rgba(77, 27, 140, 0.08)',
    borderRadius: 20,
    shadowColor: colors.coralDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  paper: {
    backgroundColor: colors.paper,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
  },
  padded: {
    padding: spacing.base,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
  },
});
