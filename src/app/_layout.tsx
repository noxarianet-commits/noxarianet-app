import { DMMono_400Regular } from '@expo-google-fonts/dm-mono/400Regular';
import { DMMono_500Medium } from '@expo-google-fonts/dm-mono/500Medium';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Application from 'expo-application';
import { useFonts } from 'expo-font';
import { NavigationBar } from 'expo-navigation-bar';
import { SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import {
  MaintenanceScreen,
  UpdateScreen,
} from '@/components/system/SystemScreens';
import { NotificationBar } from '@/components/ui/NotificationBar';
import { useAppConfig } from '@/hooks/useAppConfig';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { initNotifications } from '@/lib/notifications';
import { isVersionBelow } from '@/lib/version';
import { queryClient } from '@/query/queryClient';
import { navigationTheme, paperTheme } from '@/theme';
import { colors } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    void initNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={paperTheme}>
          <SafeAreaProvider>
            <AuthProvider>
              <ThemeProvider value={navigationTheme}>
                <StatusBar style="dark" />
                <NavigationBar style="light" />
                <BootstrapGate />
                <NotificationBar />
              </ThemeProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function BootstrapGate() {
  const { status } = useAuth();
  const configQuery = useAppConfig();
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  const ready =
    (fontsLoaded || !!fontError) && status !== 'loading';

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  const config = configQuery.data;

  if (config?.maintenance) {
    return (
      <MaintenanceScreen
        message={config.shop_status?.message}
        retrying={configQuery.isFetching}
        onRetry={() => void configQuery.refetch()}
      />
    );
  }

  const currentVersion = Application.nativeApplicationVersion;

  if (
    !__DEV__ &&
    config?.min_version &&
    isVersionBelow(currentVersion, config.min_version)
  ) {
    return (
      <UpdateScreen
        currentVersion={currentVersion}
        minimumVersion={config.min_version}
        retrying={configQuery.isFetching}
        onRetry={() => void configQuery.refetch()}
      />
    );
  }

  return <RootNavigator />;
}

function RootNavigator() {
  const { session } = useAuth();

  // Plumbung push notification: daftarkan token saat login, buka layar
  // terkait saat notifikasi disadap.
  usePushNotifications();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.paper },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="produk/[id]" />
        <Stack.Screen name="checkout/[productId]" />
        <Stack.Screen name="tagihan/[productId]" />
        <Stack.Screen name="pembayaran/[orderId]" />
        <Stack.Screen name="pesanan/[id]" />
        <Stack.Screen name="topup/index" />
        <Stack.Screen name="topup/[ref]" />
        <Stack.Screen name="saldo/riwayat" />
        <Stack.Screen name="profil/edit" />
        <Stack.Screen name="profil/password" />
        <Stack.Screen name="bantuan" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
});
