import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PlantStoreProvider } from "@/hooks/plant-store";
import { AuthProvider } from "@/providers/auth-provider";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PlantStoreProvider>
            <GestureHandlerRootView style={styles.container}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </PlantStoreProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});