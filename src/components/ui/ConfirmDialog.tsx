import { Button, Dialog, Portal } from 'react-native-paper';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius } from '@/theme/tokens';

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  destructive = false,
  loading = false,
  onConfirm,
  onDismiss,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={loading ? undefined : onDismiss}
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.md,
        }}
      >
        <Dialog.Title style={{ fontFamily: fonts.bold, color: colors.ink }}>
          {title}
        </Dialog.Title>
        <Dialog.Content>
          <AppText variant="bodyMedium" color={colors.muted}>
            {message}
          </AppText>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={onDismiss}
            textColor={colors.mutedStrong}
            disabled={loading}
            uppercase={false}
            labelStyle={{ fontFamily: fonts.semiBold }}
          >
            {cancelLabel}
          </Button>
          <Button
            onPress={onConfirm}
            textColor={destructive ? colors.danger : colors.coralDark}
            loading={loading}
            disabled={loading}
            uppercase={false}
            labelStyle={{ fontFamily: fonts.semiBold }}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
