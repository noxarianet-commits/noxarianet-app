import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Clipboard from 'expo-clipboard';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Tone = 'info' | 'warning' | 'danger' | 'success';

const TONES: Record<
  Tone,
  { bg: string; border: string; fg: string; icon: string }
> = {
  info: {
    bg: colors.surfaceMuted,
    border: colors.line,
    fg: colors.inkSoft,
    icon: 'information-outline',
  },
  warning: {
    bg: colors.goldSoft,
    border: '#E7D4A8',
    fg: colors.goldInk,
    icon: 'alert-outline',
  },
  danger: {
    bg: colors.dangerSoft,
    border: '#EFC7C2',
    fg: colors.dangerInk,
    icon: 'alert-circle-outline',
  },
  success: {
    bg: colors.tealSoft,
    border: '#C4E2D8',
    fg: colors.tealInk,
    icon: 'check-circle-outline',
  },
};

type Props = {
  tone?: Tone;
  title?: string;
  message?: string;
  icon?: IconName;
  action?: ReactNode;
  style?: object;
  copyable?: boolean;
  copyText?: string;
};

export function InfoBanner({
  tone = 'info',
  title,
  message,
  icon,
  action,
  style,
  copyable = false,
  copyText,
}: Props) {
  const palette = TONES[tone];
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = copyText || message || title || '';
    if (!textToCopy) return;

    try {
      await Clipboard.setStringAsync(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={(icon || palette.icon) as IconName}
        size={20}
        color={palette.fg}
        style={styles.icon}
      />
      <View style={styles.copy}>
        {title ? (
          <AppText variant="titleSmall" style={{ color: palette.fg }} selectable>
            {title}
          </AppText>
        ) : null}
        {message ? (
          <AppText
            variant="bodySmall"
            selectable
            style={[styles.message, { color: palette.fg }]}
          >
            {message}
          </AppText>
        ) : null}
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>

      {copyable ? (
        <Pressable
          onPress={() => void handleCopy()}
          accessibilityRole="button"
          accessibilityLabel="Salin Teks"
          style={({ pressed }) => [
            styles.copyBtn,
            copied && styles.copyBtnDone,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name={copied ? 'check' : 'content-copy'}
            size={12}
            color={copied ? '#155724' : palette.fg}
          />
          <AppText
            style={[
              styles.copyBtnText,
              { color: copied ? '#155724' : palette.fg },
            ]}
          >
            {copied ? 'Tersalin' : 'Salin'}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    alignItems: 'flex-start',
    position: 'relative',
  },
  icon: {
    marginTop: 1,
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  message: {
    fontFamily: fonts.regular,
    opacity: 0.9,
  },
  action: {
    marginTop: spacing.xs,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    alignSelf: 'flex-start',
    marginLeft: spacing.xs,
  },
  copyBtnDone: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  copyBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.7,
  },
});
