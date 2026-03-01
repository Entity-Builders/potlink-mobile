import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { analytics } from './analyticsService';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Global error boundary for Potlink.
 * Catches any unhandled React render errors and reports them to PostHog.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    analytics.captureError(error, {
      component_stack: info.componentStack,
      screen: 'unknown',
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🌿</Text>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.message}>
            El error fue registrado. Intentá de nuevo.
          </Text>
          {__DEV__ && (
            <Text style={styles.devError}>{this.state.errorMessage}</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  devError: {
    fontSize: 11,
    color: '#c00',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 24,
    padding: 8,
    backgroundColor: '#fff0f0',
    borderRadius: 4,
  },
  button: {
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
