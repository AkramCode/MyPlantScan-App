import React, { useCallback } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function OnboardingWelcome() {
  const insets = useSafeAreaInsets();

  const handleGetStarted = useCallback(() => {
    router.replace('/onboarding');
  }, []);

  // Skip removed per request

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}> 
      <View style={styles.content}> 
        <Image
          source={require('@/assets/onboarding/welcome.webp')}
          style={styles.logo}
          resizeMode='contain'
          accessibilityIgnoresInvertColors
        />
  <Text style={styles.title}>Welcome to MyPlantScan</Text>
  <Text style={styles.subtitle}>Smarter plant care</Text>
  <Text style={styles.description}>Scan, diagnose, and track with AI.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: Colors.primary }]}
          onPress={handleGetStarted}
          accessibilityRole='button'
          accessibilityLabel='Get started with onboarding'
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 8,
  },
  logo: {
    width: '100%',
    height: 340,
    marginTop: 12,
    marginHorizontal: 2,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.2,
  },
  // secondary button removed
});


