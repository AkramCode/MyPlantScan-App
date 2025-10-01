import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AuthScreen from '@/components/AuthScreen';
import { Colors } from '@/constants/colors';

export default function AuthIndex() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const handleSuccess = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  return (
    <View style={styles.container}>
      <AuthScreen onAuthSuccess={handleSuccess} mode={params.mode === 'signup' ? 'signup' : undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});


