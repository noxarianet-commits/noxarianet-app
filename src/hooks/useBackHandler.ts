import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { BackHandler, Platform, ToastAndroid } from 'react-native';

/**
 * Hook to handle Android hardware back button on root screen (Beranda).
 * Shows a native toast "Tekan sekali lagi untuk keluar dari aplikasi",
 * and exits the app if pressed twice within 2 seconds.
 */
export function useDoubleBackToExit(
  message = 'Tekan sekali lagi untuk keluar dari aplikasi',
) {
  const lastBackPressTime = useRef<number>(0);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onBackPress = () => {
        const now = Date.now();
        if (now - lastBackPressTime.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPressTime.current = now;
        ToastAndroid.show(message, ToastAndroid.SHORT);
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => subscription.remove();
    }, [message]),
  );
}

/**
 * Hook to intercept Android hardware back press and execute a smooth custom navigation
 * or action (e.g. on payment screen or checkout).
 */
export function useHardwareBackPress(handler: () => boolean | void) {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onBackPress = () => {
        const handled = handler();
        return handled !== false;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => subscription.remove();
    }, [handler]),
  );
}

/**
 * Hook for secondary tabs (Profil/Akun, Katalog, Pesanan) to ensure Android
 * hardware back press returns smoothly to the initial Home tab (Beranda)
 * instead of unexpectedly closing the application.
 */
export function useTabBackToHome() {
  useHardwareBackPress(() => {
    router.navigate('/(tabs)');
    return true;
  });
}

