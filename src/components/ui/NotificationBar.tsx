import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import {
  addNotificationListener,
  type AppNotification,
} from '@/lib/notifications';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const TONE_STYLES = {
  success: {
    bg: '#E4F1ED',
    border: '#247D78',
    text: '#0F3D3A',
    iconColor: '#247D78',
    defaultIcon: 'check-circle' as IconName,
  },
  warning: {
    bg: '#F7EDD8',
    border: '#BD8828',
    text: '#5C3F0C',
    iconColor: '#BD8828',
    defaultIcon: 'alert-circle' as IconName,
  },
  danger: {
    bg: '#F9E3E0',
    border: '#BD4A43',
    text: '#4A1512',
    iconColor: '#BD4A43',
    defaultIcon: 'alert-octagon' as IconName,
  },
  info: {
    bg: '#EDE7F6',
    border: '#4D1B8C',
    text: '#311059',
    iconColor: '#4D1B8C',
    defaultIcon: 'information' as IconName,
  },
};

export function NotificationBar() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<AppNotification | null>(null);
  const [translateY] = useState(() => new Animated.Value(-120));
  const [opacity] = useState(() => new Animated.Value(0));
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrent(null);
    });
  }, [opacity, translateY]);

  useEffect(() => {
    const unsubscribe = addNotificationListener((notification) => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
      setCurrent(notification);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      dismissTimer.current = setTimeout(() => {
        handleDismiss();
      }, 4500);
    });

    return () => {
      unsubscribe();
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [handleDismiss, opacity, translateY]);

  if (!current) return null;

  const toneConfig = TONE_STYLES[current.tone] || TONE_STYLES.info;
  const iconName = (current.icon as IconName) || toneConfig.defaultIcon;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.overlay,
        {
          paddingTop: Math.max(insets.top + spacing.xs, 12),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable
        onPress={handleDismiss}
        style={[
          styles.card,
          {
            backgroundColor: toneConfig.bg,
            borderColor: toneConfig.border,
          },
        ]}
      >
        <View style={styles.contentRow}>
          <MaterialCommunityIcons
            name={iconName}
            size={24}
            color={toneConfig.iconColor}
            style={styles.icon}
          />
          <View style={styles.textWrap}>
            <AppText
              variant="labelLarge"
              style={[styles.title, { color: toneConfig.text }]}
              numberOfLines={1}
            >
              {current.title}
            </AppText>
            <AppText
              variant="bodySmall"
              style={[styles.body, { color: toneConfig.text }]}
              numberOfLines={2}
            >
              {current.body}
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={toneConfig.text}
            style={styles.closeIcon}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: spacing.base,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.md,
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 14,
    marginBottom: 2,
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.9,
  },
  closeIcon: {
    marginLeft: spacing.sm,
    opacity: 0.7,
    flexShrink: 0,
  },
});

