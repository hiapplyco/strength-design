import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { GlassCard } from './GlassmorphismComponents';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const BIOMETRIC_PREFERENCE_KEY = '@biometric_preference';

const BiometricSettings = ({ onBiometricEnabled }) => {
  const theme = useTheme();

  // Defensive: ensure colors are available with fallbacks
  const colors = theme?.colors || {
    primary: '#FF6B35',
    text: '#FFFFFF',
    secondary: '#8E8E93',
    surface: '#1C1C1E',
    border: '#38383A'
  };

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBiometricSupport();
    loadBiometricPreference();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      // Check if hardware supports biometric authentication
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);

      if (compatible) {
        // Check if biometric records are enrolled
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsEnrolled(enrolled);

        // Get the type of biometric authentication
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType(Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint');
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('Iris');
        } else {
          setBiometricType('Biometric');
        }
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBiometricPreference = async () => {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      setIsBiometricEnabled(enabled === 'true');
    } catch (error) {
      console.error('Error loading biometric preference:', error);
    }
  };

  const handleToggleBiometric = async () => {
    if (!isBiometricEnabled) {
      // User wants to enable biometric auth - authenticate first
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: `Enable ${biometricType || 'Biometric'} Authentication`,
          fallbackLabel: 'Use passcode',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (result.success) {
          // Authentication successful - enable biometric
          await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
          await AsyncStorage.setItem(BIOMETRIC_PREFERENCE_KEY, 'enabled');
          setIsBiometricEnabled(true);

          if (onBiometricEnabled) {
            onBiometricEnabled(true);
          }

          Alert.alert(
            'Success',
            `${biometricType || 'Biometric'} authentication has been enabled.`
          );
        } else {
          // Authentication failed
          Alert.alert(
            'Authentication Failed',
            'Unable to verify your identity. Please try again.'
          );
        }
      } catch (error) {
        console.error('Biometric authentication error:', error);
        Alert.alert(
          'Error',
          'An error occurred while setting up biometric authentication.'
        );
      }
    } else {
      // User wants to disable - confirm first
      Alert.alert(
        'Disable Biometric Authentication',
        `Are you sure you want to disable ${biometricType || 'biometric'} authentication?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
              await AsyncStorage.setItem(BIOMETRIC_PREFERENCE_KEY, 'disabled');
              setIsBiometricEnabled(false);

              if (onBiometricEnabled) {
                onBiometricEnabled(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleSetupBiometric = () => {
    Alert.alert(
      'Setup Biometric Authentication',
      `To use ${biometricType || 'biometric'} authentication, you need to set it up in your device settings first.`,
      [
        {
          text: 'OK',
          style: 'default',
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    leftContent: {
      flex: 1,
      marginRight: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    description: {
      fontSize: 13,
      color: colors.secondary,
      marginTop: 4,
      lineHeight: 18,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 4,
    },
    setupButton: {
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.primary + '20',
    },
    setupButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
    },
    notSupportedText: {
      fontSize: 13,
      color: colors.secondary,
      fontStyle: 'italic',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <GlassCard style={styles.card}>
          <Text style={styles.description}>Loading biometric settings...</Text>
        </GlassCard>
      </View>
    );
  }

  if (!isBiometricSupported) {
    return (
      <View style={styles.container}>
        <GlassCard style={styles.card}>
          <View style={styles.leftContent}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="finger-print" size={18} color={colors.secondary} />
              </View>
              <Text style={styles.title}>Biometric Authentication</Text>
            </View>
            <Text style={styles.notSupportedText}>
              Biometric authentication is not available on this device.
            </Text>
          </View>
        </GlassCard>
      </View>
    );
  }

  if (!isEnrolled) {
    return (
      <View style={styles.container}>
        <GlassCard style={styles.card}>
          <View style={styles.leftContent}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="finger-print" size={18} color={colors.primary} />
              </View>
              <Text style={styles.title}>{biometricType} Authentication</Text>
            </View>
            <Text style={styles.description}>
              No biometric data is enrolled on this device.
            </Text>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={handleSetupBiometric}
              activeOpacity={0.7}
            >
              <Text style={styles.setupButtonText}>Setup in Settings</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <View style={styles.leftContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="finger-print"
                size={18}
                color={isBiometricEnabled ? colors.primary : colors.secondary}
              />
            </View>
            <Text style={styles.title}>{biometricType} Authentication</Text>
          </View>
          <Text style={styles.description}>
            {isBiometricEnabled
              ? `Use ${biometricType} to unlock the app quickly and securely.`
              : `Enable ${biometricType} for quick and secure access to your account.`}
          </Text>
          {isBiometricEnabled && (
            <View style={[styles.statusBadge, { backgroundColor: (colors.success || '#34C759') + '20' }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success || '#34C759'} />
              <Text style={[styles.statusText, { color: colors.success || '#34C759' }]}>Enabled</Text>
            </View>
          )}
        </View>
        <Switch
          value={isBiometricEnabled}
          onValueChange={handleToggleBiometric}
          trackColor={{ false: colors.border, true: colors.primary + '60' }}
          thumbColor={isBiometricEnabled ? colors.primary : colors.secondary}
          ios_backgroundColor={colors.border}
        />
      </GlassCard>
    </View>
  );
};

export default BiometricSettings;