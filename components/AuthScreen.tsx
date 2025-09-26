import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { Eye, EyeOff, Mail, Lock, User, Leaf } from 'lucide-react-native';
import { useAuth } from '@/providers/auth-provider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AuthMode = 'signin' | 'signup' | 'forgot';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp, resetPassword } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      let result;
      
      if (mode === 'signin') {
        result = await signIn(email, password);
      } else if (mode === 'signup') {
        result = await signUp(email, password, fullName);
      } else {
        result = await resetPassword(email);
      }

      if (result.error) {
        Alert.alert(
          mode === 'signin' ? 'Sign In Error' : 
          mode === 'signup' ? 'Sign Up Error' : 
          'Reset Password Error',
          result.error.message || 'An unexpected error occurred'
        );
      } else if (mode === 'forgot') {
        Alert.alert(
          'Reset Password',
          'If an account with that email exists, we\'ve sent you a password reset link.',
          [{ text: 'OK', onPress: () => setMode('signin') }]
        );
      } else if (mode === 'signup') {
        Alert.alert(
          'Account Created',
          'Please check your email to verify your account before signing in.',
          [{ text: 'OK', onPress: () => setMode('signin') }]
        );
      } else if (mode === 'signin') {
        // Sign-in was successful, call the success callback
        onAuthSuccess?.();
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (mode === 'forgot') {
      return email.trim().length > 0;
    }
    if (mode === 'signup') {
      return email.trim().length > 0 && password.length >= 6 && fullName.trim().length > 0;
    }
    return email.trim().length > 0 && password.length >= 6;
  };

  const getButtonText = () => {
    if (isLoading) return 'Please wait...';
    switch (mode) {
      case 'signin': return 'Sign In';
      case 'signup': return 'Create Account';
      case 'forgot': return 'Send Reset Link';
      default: return 'Continue';
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signin': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'forgot': return 'Reset Password';
      default: return 'MyPlantScan';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signin': return 'Sign in to continue your plant journey';
      case 'signup': return 'Join the MyPlantScan community';
      case 'forgot': return 'Enter your email to reset your password';
      default: return '';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.background, { paddingTop: insets.top }]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Leaf size={40} color="#22C55E" />
            </View>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {mode === 'signup' && (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoComplete="name"
                    testID="fullname-input"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  testID="email-input"
                />
              </View>
            </View>

            {mode !== 'forgot' && (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    testID="password-input"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    testID="toggle-password-visibility"
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#6B7280" />
                    ) : (
                      <Eye size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isFormValid() || isLoading) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid() || isLoading}
              testID="submit-button"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>{getButtonText()}</Text>
              )}
            </TouchableOpacity>

            {/* Mode Switching */}
            <View style={styles.switchContainer}>
              {mode === 'signin' && (
                <>
                  <TouchableOpacity
                    onPress={() => setMode('forgot')}
                    testID="forgot-password-link"
                  >
                    <Text style={styles.linkText}>Forgot Password?</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.signupPrompt}>
                    <Text style={styles.promptText}>Don&apos;t have an account? </Text>
                    <TouchableOpacity
                      onPress={() => setMode('signup')}
                      testID="signup-link"
                    >
                      <Text style={styles.linkText}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {mode === 'signup' && (
                <View style={styles.signupPrompt}>
                  <Text style={styles.promptText}>Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => setMode('signin')}
                    testID="signin-link"
                  >
                    <Text style={styles.linkText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}

              {mode === 'forgot' && (
                <TouchableOpacity
                  onPress={() => setMode('signin')}
                  testID="back-to-signin-link"
                >
                  <Text style={styles.linkText}>Back to Sign In</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: '100%',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  switchContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  signupPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  promptText: {
    fontSize: 14,
    color: '#6B7280',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});