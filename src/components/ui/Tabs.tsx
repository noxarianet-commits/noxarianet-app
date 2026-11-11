import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius } from '@/theme/tokens';

type Item = { key: string; label: string };

export function UnderlineTabs({
  items,
  value,
  onChange,
  style,
}: {
  items: readonly Item[];
  value: string;
  onChange: (key: string) => void;
  style?: object;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.underlineRow, style]}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={styles.underlineItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <AppText
              variant="labelLarge"
              color={active ? colors.ink : colors.muted}
              style={active ? styles.activeLabel : undefined}
            >
              {item.label}
            </AppText>
            <View
              style={[
                styles.underline,
                active ? styles.underlineActive : null,
              ]}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function FilterChips({
  items,
  value,
  onChange,
  style,
}: {
  items: readonly Item[];
  value: string;
  onChange: (key: string) => void;
  style?: object;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.chipRow, style]}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            hitSlop={4}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <AppText
              variant="labelMedium"
              color={active ? colors.coralInk : colors.mutedStrong}
              style={active ? styles.chipActiveLabel : undefined}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  underlineRow: {
    gap: 24,
    paddingRight: 20,
  },
  underlineItem: {
    paddingTop: 6,
    minHeight: 44,
    justifyContent: 'space-between',
  },
  activeLabel: {
    fontFamily: fonts.semiBold,
  },
  underline: {
    height: 2,
    backgroundColor: 'transparent',
    marginTop: 8,
    borderRadius: 1,
  },
  underlineActive: {
    backgroundColor: colors.coral,
  },
  chipRow: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.coralSoft,
    borderColor: colors.coral,
  },
  chipActiveLabel: {
    fontFamily: fonts.semiBold,
  },
});
