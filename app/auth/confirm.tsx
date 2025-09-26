import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

const CHECKMARK = '\u2713';
const ERROR_MARK = '!';

export default function AuthConfirmScreen() {
  const { token, type } = useLocalSearchParams<{ token: string; type?: string }>();
  const router = useRouter();
  const { confirmEmail } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleConfirmation = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid confirmation link. No token provided.');
        return;
      }

      try {
        // Handle email confirmation
        if (type === 'signup' || !type) {
          const { error } = await confirmEmail(token);
          
          if (error) {
            setStatus('error');
            setMessage(error.message);
            return;
          }
          
          setStatus('success');
          setMessage('Email confirmed successfully! You can now sign in.');
          
          // Redirect to home after 2 seconds
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Unknown confirmation type.');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Failed to confirm email. Please try again.');
      }
    };

    handleConfirmation();
  }, [token, type, confirmEmail, router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.title}>Confirming your email...</Text>
            <Text style={styles.subtitle}>Please wait while we verify your account.</Text>
          </>
        )}
        
        {status === 'success' && (
          <>
            <View style={styles.successIcon}>
              <Text style={styles.checkmark}>{CHECKMARK}</Text>
            </View>
            <Text style={styles.title}>Email Confirmed!</Text>
            <Text style={styles.subtitle}>{message}</Text>
          </>
        )}
        
        {status === 'error' && (
          <>
            <View style={styles.errorIcon}>
              <Text style={styles.errorMark}>{ERROR_MARK}</Text>
            </View>
            <Text style={styles.title}>Confirmation Failed</Text>
            <Text style={styles.subtitle}>{message}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 24,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
  },
  errorMark: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
  },
});




