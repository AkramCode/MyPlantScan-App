import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F9FAFB' },
        headerTintColor: '#111827',
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen 
        name="confirm" 
        options={{ 
          title: 'Email Confirmation',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="reset-password" 
        options={{ 
          title: 'Reset Password',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}