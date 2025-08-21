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
import { useTheme, themedStyles } from '../contexts/ThemeContext';
import { GlassContainer, GlassCard, GlassButton } from '../components/GlassmorphismComponents';
import { colors } from '../utils/designTokens';
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
  
  // Theme-aware styles
  const containerStyles = themedStyles(({ theme }) => ({
    flex: 1,
    backgroundColor: 'transparent',
  }));
  
  const scrollContentStyles = themedStyles(({ spacing }) => ({
    flexGrow: 1,
    paddingBottom: spacing[6] || 24,
  }));
  
  const headerStyles = themedStyles(({ spacing }) => ({
    paddingTop: 80,
    paddingBottom: spacing[10] || 40,
    paddingHorizontal: spacing[4] || 16,
    alignItems: 'center',
  }));
  
  const logoStyles = themedStyles(({ typography, theme }) => ({
    fontSize: typography?.fontSize?.['3xl'] || 28,
    fontWeight: typography?.fontWeight?.bold || 'bold',
    color: theme.isDarkMode ? '#FFFFFF' : '#1A1A1A',
    marginTop: 10,
    textAlign: 'center',
  }));
  
  const taglineStyles = themedStyles(({ typography, theme }) => ({
    fontSize: typography?.fontSize?.base || 15,
    color: theme.isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    marginTop: 6,
    textAlign: 'center',
  }));
  
  const formContainerStyles = themedStyles(({ spacing }) => ({
    flex: 1,
    padding: spacing[4] || 16,
    paddingHorizontal: spacing[5] || 20,
    justifyContent: 'center',
  }));
  
  const titleStyles = themedStyles(({ theme, typography, spacing }) => ({
    fontSize: typography?.fontSize?.['2xl'] || 22,
    fontWeight: typography?.fontWeight?.bold || 'bold',
    color: theme.textOnGlass,
    textAlign: 'center',
    marginBottom: spacing[6] || 24,
  }));
  
  const inputContainerStyles = themedStyles(({ spacing, borderRadius }) => ({
    marginBottom: spacing[4] || 15,
    borderRadius: borderRadius?.component?.input?.md || 12,
  }));
  
  const inputWrapperStyles = themedStyles(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 54, // Enhanced touch target
  }));
  
  const inputStyles = themedStyles(({ theme, typography, isDarkMode }) => ({
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 12,
    color: isDarkMode ? '#FFFFFF' : '#000000',
    fontSize: typography?.fontSize?.base || 15,
    fontWeight: typography?.fontWeight?.medium || '500',
  }));
  
  const buttonWrapperStyles = themedStyles(({ spacing }) => ({
    marginTop: spacing[5] || 20,
    marginBottom: spacing[4] || 16,
  }));
  
  const switchButtonStyles = themedStyles(({ spacing }) => ({
    marginTop: spacing[4] || 16,
    alignItems: 'center',
  }));
  
  const switchTextStyles = themedStyles(({ theme, typography }) => ({
    color: theme.primary,
    fontSize: typography?.fontSize?.sm || 13,
    fontWeight: typography?.fontWeight?.medium || '500',
  }));
  
  const demoHintStyles = themedStyles(({ spacing }) => ({
    marginTop: spacing[8] || 32,
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={containerStyles}
    >
      <ScrollView 
        contentContainerStyle={scrollContentStyles}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Header with New Logo */}
        <View style={headerStyles}>
          <AppLogo 
            size="xlarge" 
            showGlow={true}
            style={{ marginBottom: 20 }}
          />
          <Text style={logoStyles}>Strength.Design</Text>
          <Text style={taglineStyles}>AI-Powered Fitness</Text>
        </View>

        {/* Enhanced Form with Glass Container */}
        <View style={formContainerStyles}>
          <Text style={titleStyles}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>

          {/* Email Input with Glass Effect */}
          <View
            style={[inputContainerStyles, { 
              backgroundColor: 'white',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.1)',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }]}
            accessible={true}
            accessibilityLabel="Email input container"
          >
            <View style={inputWrapperStyles}>
              <Ionicons 
                name="mail" 
                size={20} 
                color="#666666"
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={[inputStyles, { color: '#000000' }]}
                placeholder="Email"
                placeholderTextColor="#999999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                accessibilityLabel="Email input"
                accessibilityHint="Enter your email address"
              />
            </View>
          </View>

          {/* Password Input with Glass Effect */}
          <View
            style={[inputContainerStyles, { 
              backgroundColor: 'white',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.1)',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }]}
            accessible={true}
            accessibilityLabel="Password input container"
          >
            <View style={inputWrapperStyles}>
              <Ionicons 
                name="lock-closed" 
                size={20} 
                color="#666666"
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={[inputStyles, { color: '#000000' }]}
                placeholder="Password"
                placeholderTextColor="#999999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleAuth}
                accessibilityLabel="Password input"
                accessibilityHint="Enter your password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ padding: 8 }}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Enhanced Glass Button */}
          <View style={buttonWrapperStyles}>
            <TouchableOpacity
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={loading ? 'Loading' : (isSignUp ? 'Create account' : 'Sign in')}
              accessibilityState={{ disabled: loading }}
            >
              <SafeLinearGradient
                colors={theme.isDarkMode ? ['#D97A4A', '#C9626B'] : ['#FF6B35', '#FF7E87']}
                fallbackColors={['#D97A4A', '#C9626B']}
                style={{
                  paddingVertical: 18,
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  alignItems: 'center',
                  shadowColor: theme.theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.19,
                  shadowRadius: 8,
                  elevation: 8,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </Text>
              </SafeLinearGradient>
            </TouchableOpacity>
          </View>

          {/* Switch Mode Button */}
          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            style={switchButtonStyles}
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? 'Switch to sign in' : 'Switch to sign up'}
          >
            <Text style={switchTextStyles}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>

          {/* Enhanced Demo Credentials Hint */}
          <GlassCard
            variant="subtle"
            style={demoHintStyles}
            accessible={true}
            accessibilityLabel="Demo account credentials"
          >
            <View style={{ alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{
                color: theme.theme.textSecondary,
                fontSize: 12,
                fontWeight: '500',
                marginBottom: 6,
              }}>
                Demo Account:
              </Text>
              <Text style={{
                color: theme.theme.primary,
                fontSize: 14,
                fontWeight: '600',
                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                textAlign: 'center',
              }}>
                demo@strength.design / demo123
              </Text>
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    textShadow: '0px 2px 4px rgba(0, 0, 0, 0.4)',
  },
  tagline: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
    textShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)',
  },
  formContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    textShadow: '0px 2px 4px rgba(0, 0, 0, 0.4)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    color: 'white',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#FF6B35',
    fontSize: 14,
  },
  demoHint: {
    marginTop: 40,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  demoText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  demoCredentials: {
    color: '#FF6B35',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});