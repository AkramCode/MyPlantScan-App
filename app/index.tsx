import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { clearOnboardingFlag, getForceOnboardingEnabled, getHasCompletedOnboarding } from '@/lib/onboarding-storage';

export default function LaunchGate() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [force, completed] = await Promise.all([
          getForceOnboardingEnabled(),
          getHasCompletedOnboarding(),
        ]);

        if (force) {
          await clearOnboardingFlag();
          if (mounted) router.replace('/onboarding/welcome');
          return;
        }

        if (!completed) {
          if (mounted) router.replace('/onboarding/welcome');
          return;
        }

        if (mounted) router.replace('/(tabs)');
      } catch (_e) {
        if (mounted) router.replace('/onboarding/welcome');
      } finally {
        if (mounted) setBooted(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!booted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return null;
}


