/**
 * Login Screen for WMS Mobile App
 */

import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Title,
  Snackbar
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { theme, spacing } from '../theme/theme';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn, error, clearError } = useAuth();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(username.trim(), password);
      if (!result.success) {
        Alert.alert('Login Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Title style={styles.title}>WMS Mobile</Title>
          <Text style={styles.subtitle}>Warehouse Management System</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              disabled={loading}
            />
            
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              disabled={loading}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Card.Content>
        </Card>

        <Text style={styles.footer}>
          MySQL Database Integration • Offline Support
        </Text>
      </ScrollView>

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={4000}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  card: {
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.md,
  },
  loginButton: {
    marginTop: spacing.md,
  },
  loginButtonContent: {
    height: 48,
  },
  footer: {
    textAlign: 'center',
    color: theme.colors.onSurface,
    opacity: 0.6,
    fontSize: 14,
  },
});

export default LoginScreen;