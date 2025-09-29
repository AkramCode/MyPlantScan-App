import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PlantStoreProvider } from "@/hooks/plant-store";
import { AuthProvider } from "@/providers/auth-provider";
import { SettingsProvider } from "@/providers/settings-provider";
import { getHasCompletedOnboarding } from "@/lib/onboarding-storage";

void SplashScreen.preventAutoHideAsync().catch(() => null);

const queryClient = new QueryClient();

type RootLayoutNavProps = {
  initialRouteName: string;
};

function RootLayoutNav({ initialRouteName }: RootLayoutNavProps) {
  return (
    <Stack initialRouteName={initialRouteName} screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
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
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const prepare = async () => {
      try {
        const hasCompleted = await getHasCompletedOnboarding();
        setInitialRoute(hasCompleted ? "(tabs)" : "onboarding");
      } catch (error) {
        console.error("RootLayout: onboarding check failed", error);
        setInitialRoute("(tabs)");
      } finally {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.error("RootLayout: hide splash failed", error);
        }
      }
    };

    void prepare();
  }, []);

  if (!initialRoute) {
    return null;
  }

  return (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
