import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AuthScreen from '@/components/AuthScreen';
import { Colors } from '@/constants/colors';

export default function AuthIndex() {
  const handleSuccess = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  return (
    <View style={styles.container}>
      <AuthScreen onAuthSuccess={handleSuccess} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});


