import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { SafeLinearGradient } from '../components/SafeLinearGradient';
import { GlassContainer, GlassButton } from '../components/GlassmorphismComponents';
import { useTheme } from '../contexts/ThemeContext';

let LiveScreenImpl = null;
let implLoadError = null;

function resolveLiveScreen() {
  if (LiveScreenImpl || implLoadError) {
    return { LiveScreenImpl, error: implLoadError };
  }

  try {
    LiveScreenImpl = require('./PoseAnalysisLiveScreen.impl').default;
  } catch (error) {
    implLoadError = error;
  }

  return { LiveScreenImpl, error: implLoadError };
}

export default function PoseAnalysisLiveScreen(props) {
  const themeContext = useTheme();
  const theme = themeContext?.colors || {
    primary: '#FF6B35',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
  };

  const isExpoGo = Constants?.appOwnership === 'expo';
  if (isExpoGo) {
    return (
      <UnsupportedLiveScreen
        theme={theme}
        message="Gemini Live requires a development client or standalone build. Install the Strength.Design Dev Client or run `expo run:ios` to try live streaming."
      />
    );
  }

  const { LiveScreenImpl: Impl, error } = resolveLiveScreen();
  if (error || !Impl) {
    console.warn('Gemini Live unavailable:', error);
    return (
      <UnsupportedLiveScreen
        theme={theme}
        message="Gemini Live couldn't initialize. Ensure the development build includes react-native-webrtc and restart the app."
      />
    );
  }

  return <Impl {...props} />;
}

function UnsupportedLiveScreen({ theme, message }) {
  return (
    <SafeLinearGradient
      type="background"
      variant="oura"
      style={styles.container}
    >
      <View style={styles.centerContent}>
        <GlassContainer variant="medium" style={styles.unsupportedCard}>
          <Text style={[styles.unsupportedTitle, { color: theme.text }]}>
            Gemini Live Not Available
          </Text>
          <Text style={[styles.unsupportedMessage, { color: theme.textSecondary }]}>
            {message}
          </Text>
          <GlassButton
            style={styles.unsupportedButton}
            onPress={() => {
              console.log('Gemini Live requires a dev build. See docs for setup.');
            }}
            disabled
          >
            <Text style={styles.unsupportedButtonText}>Requires Dev Build</Text>
          </GlassButton>
        </GlassContainer>
      </View>
    </SafeLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    width: '100%',
    paddingHorizontal: 24,
  },
  unsupportedCard: {
    padding: 24,
    gap: 16,
  },
  unsupportedTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  unsupportedMessage: {
    fontSize: 16,
    lineHeight: 22,
  },
  unsupportedButton: {
    borderRadius: 20,
    paddingVertical: 12,
    opacity: 0.7,
  },
  unsupportedButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
