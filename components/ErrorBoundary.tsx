import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage?: string;
  errorStack?: string;
};

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return { hasError: true, errorMessage: message, errorStack: stack };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Global ErrorBoundary caught error:', error, info?.componentStack);
  }

  handleReload = () => {
    if (Platform.OS === 'web') {
      window.location.reload();
    }
  };

  handleClearStorage = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.clear();
      } else {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.clear();
      }
      this.setState({ hasError: false, errorMessage: undefined, errorStack: undefined });
    } catch (err) {
      console.warn('ErrorBoundary: failed to clear storage', err);
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Something went wrong</Text>
          {this.state.errorMessage && (
            <Text style={styles.message}>{this.state.errorMessage}</Text>
          )}
          {this.state.errorStack && (
            <Text style={styles.stack} numberOfLines={16}>{this.state.errorStack}</Text>
          )}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={this.handleReload}>
              <Text style={styles.buttonText}>Reload App</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.clearBtn]} onPress={this.handleClearStorage}>
              <Text style={styles.buttonText}>Clear Storage</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 12,
    textAlign: 'center',
  },
  stack: {
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  clearBtn: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});