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
  ScrollView
} from 'react-native';
import { SafeLinearGradient } from '../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useTheme } from '../contexts/ThemeContext';
import { AppLogo } from '../components/AppLogo';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const theme = useTheme();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User created:', userCredential.user.email);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in:', userCredential.user.email);
      }
      onLogin && onLogin();
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert(
        'Authentication Error',
        error.message.replace('Firebase: ', '').replace(/\(auth.*\)/, '')
      );
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <AppLogo
            size={80}
            showGlow={true}
          />
          <Text style={[styles.logo, { color: theme?.colors?.text || '#FFFFFF' }]}>
            Strength.Design
          </Text>
          <Text style={[styles.tagline, { color: theme?.colors?.textSecondary || '#8E8E93' }]}>
            AI-Powered Fitness
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: theme?.colors?.text || '#FFFFFF' }]}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail"
              size={20}
              color="#666666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed"
              size={20}
              color="#666666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleAuth}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#666666"
              />
            </TouchableOpacity>
          </View>

          {/* Sign In/Up Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              <SafeLinearGradient
                colors={theme.isDarkMode ? ['#FF8F65', '#FFB86B'] : ['#FF6B35', '#FF7E87']}
                fallbackColors={['#FF6B35', '#FF7E87']}
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </Text>
              </SafeLinearGradient>
            </TouchableOpacity>
          </View>

          {/* Switch Mode Button */}
          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            style={styles.switchButton}
          >
            <Text style={[styles.switchText, { color: theme?.colors?.primary || '#FF6B35' }]}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>

          {/* Demo Credentials */}
          <View style={styles.demoHint}>
            <Text style={styles.demoText}>Demo Account:</Text>
            <Text style={styles.demoCredentials}>
              demo@strength.design / demo123
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    marginTop: 6,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    minHeight: 56,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500',
  },
  demoHint: {
    marginTop: 40,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  demoText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  demoCredentials: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
