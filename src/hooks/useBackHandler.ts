import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Alert, BackHandler, Platform, ToastAndroid } from 'react-native';

/**
 * Hook to handle Android hardware back button on root screen (Beranda).
 * Shows both a native Toast and an Alert Dialog confirmation to guarantee
 * 100% visibility on all devices (especially Xiaomi/MIUI, Samsung, Oppo).
 * The user can never accidentally exit the app with a single back press.
 */
export function useDoubleBackToExit(
  message = 'Tekan sekali lagi untuk keluar dari aplikasi',
) {
  const lastBackPressTime = useRef<number>(0);
  const isAlertActive = useRef<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onBackPress = () => {
        const now = Date.now();

        // 1. Jika pengguna menekan back 2x berturut-turut dalam 2 detik, langsung keluar
        if (now - lastBackPressTime.current < 2000) {
          BackHandler.exitApp();
          return true;
        }

        lastBackPressTime.current = now;

        // 2. Tampilkan Toast native jika OS mengizinkannya
        try {
          ToastAndroid.show(message, ToastAndroid.SHORT);
        } catch {}

        // 3. Tampilkan Alert Modal Dialog resmi di layar
        // Ini menjamin 100% muncul di semua tipe HP Android (termasuk Xiaomi/MIUI yang sering sembunyikan Toast)
        if (!isAlertActive.current) {
          isAlertActive.current = true;
          Alert.alert(
            'Keluar dari Aplikasi?',
            'Tekan sekali lagi atau pilih Keluar untuk menutup aplikasi Noxarianet.',
            [
              {
                text: 'Batal',
                style: 'cancel',
                onPress: () => {
                  isAlertActive.current = false;
                },
              },
              {
                text: 'Keluar',
                style: 'destructive',
                onPress: () => {
                  isAlertActive.current = false;
                  BackHandler.exitApp();
                },
              },
            ],
            {
              cancelable: true,
              onDismiss: () => {
                isAlertActive.current = false;
              },
            },
          );
        }

        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => {
        isAlertActive.current = false;
        subscription.remove();
      };
    }, [message]),
  );
}

/**
 * Hook to intercept Android hardware back press and execute a smooth custom navigation
 * or action (e.g. on payment screen or checkout).
 * Uses a ref for the handler so re-renders (countdowns, pollings) do NOT detach the listener.
 */
export function useHardwareBackPress(handler: () => boolean | void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onBackPress = () => {
        const handled = handlerRef.current();
        return handled !== false;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );
}

/**
 * Hook for secondary tabs (Profil/Akun, Katalog, Pesanan) to ensure Android
 * hardware back press returns smoothly to the initial Home tab (Beranda)
 * instead of unexpectedly closing the application.
 */
export function useTabBackToHome() {
  useHardwareBackPress(() => {
    router.replace('/(tabs)');
    return true;
  });
}

/**
 * Hook for any secondary screen to guarantee the hardware back button
 * safely navigates back without ever abruptly exiting the app.
 */
export function useSafeBack(
  fallbackRoute: string = '/(tabs)',
  onCustomBack?: () => boolean | void,
) {
  useHardwareBackPress(() => {
    if (onCustomBack) {
      const handled = onCustomBack();
      if (handled) return true;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute as any);
    }
    return true;
  });
}

