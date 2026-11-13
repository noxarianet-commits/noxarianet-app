import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

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
    <View style={[styles.underlineContainer, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.underlineRow}
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
                color={active ? colors.coral : colors.muted}
                style={[styles.tabLabel, active && styles.activeLabel]}
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
    </View>
  );
}

export function FilterChips({
  items,
  value,
  onChange,
  style,
  contentContainerStyle,
}: {
  items: readonly Item[];
  value: string;
  onChange: (key: string) => void;
  style?: object;
  contentContainerStyle?: object;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.chipsScroll, style]}
      contentContainerStyle={[styles.chipRow, contentContainerStyle]}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            hitSlop={6}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipInactive,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <AppText
              variant="labelMedium"
              style={[
                styles.chipLabel,
                active ? styles.chipActiveLabel : styles.chipInactiveLabel,
              ]}
              numberOfLines={1}
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
  underlineContainer: {
    minHeight: 44,
  },
  underlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  underlineItem: {
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  activeLabel: {
    fontFamily: fonts.bold,
    color: colors.coral,
  },
  underline: {
    height: 3,
    width: '100%',
    backgroundColor: 'transparent',
    marginTop: 6,
    borderRadius: 2,
  },
  underlineActive: {
    backgroundColor: colors.coral,
  },

  // Chips Styling
  chipsScroll: {
    flexGrow: 0,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 24,
  },
  chip: {
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  chipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: {
    backgroundColor: colors.coral,
    borderWidth: 1,
    borderColor: colors.coral,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  chipLabel: {
    fontSize: 12,
  },
  chipInactiveLabel: {
    fontFamily: fonts.medium,
    color: colors.inkSoft,
  },
  chipActiveLabel: {
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
  },
});
