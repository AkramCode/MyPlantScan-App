import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PlantStoreProvider } from "@/hooks/plant-store";
import { AuthProvider } from "@/providers/auth-provider";
import { SettingsProvider } from "@/providers/settings-provider";
import { clearOnboardingFlag, getHasCompletedOnboarding, getForceOnboardingEnabled } from "@/lib/onboarding-storage";
import ErrorBoundary from "@/components/ErrorBoundary";

const onboardingFlag = (process.env.EXPO_PUBLIC_FORCE_ONBOARDING ?? '').toLowerCase();
const FORCE_ONBOARDING_ENABLED = onboardingFlag === 'true' || (__DEV__ && onboardingFlag !== 'false');

void SplashScreen.preventAutoHideAsync().catch(() => null);

const queryClient = new QueryClient();

function RootLayoutNav({ initialRouteName }: { initialRouteName?: string }) {
  return (
    <Stack initialRouteName={initialRouteName} screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/welcome" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen
        name="plant-details"
        options={{
          title: "Plant Details",
          headerStyle: { backgroundColor: '#F9FAFB' },
          headerTintColor: '#111827',
        }}
      />
      <Stack.Screen
        name="health-report"
        options={{
          title: "Health Report",
          headerStyle: { backgroundColor: '#F9FAFB' },
          headerTintColor: '#111827',
        }}
      />
      <Stack.Screen
        name="water-calculator"
        options={{
          title: "Water Calculator",
          headerStyle: { backgroundColor: '#F9FAFB' },
          headerTintColor: '#111827',
        }}
      />
      <Stack.Screen
        name="light-meter"
        options={{
          title: "Light Meter",
          headerStyle: { backgroundColor: '#F9FAFB' },
          headerTintColor: '#111827',
        }}
      />
      <Stack.Screen name="about" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string>('onboarding/index');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const globalWindow = typeof window !== 'undefined' ? window : undefined;

    if (!globalWindow?.addEventListener || !globalWindow?.removeEventListener) {
      return;
    }

    const onError = (event: any) => {
      console.error('Global window error:', event?.error || event?.message);
    };
    const onUnhandledRejection = (event: any) => {
      console.error('Unhandled promise rejection:', event?.reason);
    };

    globalWindow.addEventListener('error', onError);
    globalWindow.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      globalWindow.removeEventListener('error', onError);
      globalWindow.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    const prepare = async () => {
      try {
        const forceFromStorage = await getForceOnboardingEnabled();
        if (FORCE_ONBOARDING_ENABLED || forceFromStorage) {
          await clearOnboardingFlag();
          setInitialRoute("onboarding/welcome");
        } else {
          const hasCompleted = await getHasCompletedOnboarding();
          setInitialRoute(hasCompleted ? "(tabs)" : "onboarding/welcome");
        }
      } catch (error) {
        console.error('RootLayout: onboarding check failed', error);
        setInitialRoute("onboarding/index");
      } finally {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.error('RootLayout: hide splash failed', error);
        }
        setIsReady(true);
      }
    };

    void prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SettingsProvider>
              <PlantStoreProvider>
                <GestureHandlerRootView style={styles.container}>
                  <RootLayoutNav initialRouteName={initialRoute} />
                </GestureHandlerRootView>
              </PlantStoreProvider>
            </SettingsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

