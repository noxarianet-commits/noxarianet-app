import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
  type Edge,
} from 'react-native-safe-area-context';

import { colors, layout } from '@/theme/tokens';

type ScreenProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  edges?: Edge[];
}>;

export function Screen({
  children,
  style,
  padded = false,
  edges = ['top', 'left', 'right'],
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={[styles.body, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

type ScrollProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
  edges?: Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  bottomInset?: number;
}>;

export function ScreenScroll({
  children,
  style,
  contentContainerStyle,
  padded = true,
  edges = ['top', 'left', 'right'],
  refreshing,
  onRefresh,
  keyboardShouldPersistTaps = 'handled',
  bottomInset = 32,
}: ScrollProps) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <ScrollView
        style={[styles.scroll, style]}
        contentContainerStyle={[
          styles.scrollContent,
          padded && styles.padded,
          { paddingBottom: bottomInset },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              colors={[colors.coralDark]}
              tintColor={colors.coralDark}
              progressBackgroundColor={colors.surface}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

type KeyboardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function KeyboardScreen({ children, style }: KeyboardProps) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  body: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  padded: {
    paddingHorizontal: layout.screenPadding,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
});
