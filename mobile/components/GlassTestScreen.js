/**
 * Glass Components Test Screen
 * Used to test glassmorphism components across different platforms
 * This file can be removed in production - it's for development testing only
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import {
  GlassContainer,
  GlassCard,
  GlassButton,
  GlassModal,
  BlurWrapper,
  useOptimizedGlassEffect,
  useGlassAccessibility
} from './GlassmorphismComponents';
import { colors } from '../utils/designTokens';

export default function GlassTestScreen({ navigation }) {
  const { theme, isDarkMode, changeTheme, themeMode } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('medium');
  
  const glassAccessibility = useGlassAccessibility(theme.background);
  
  const testGradient = isDarkMode 
    ? colors.dark.background.gradient.app 
    : colors.light.background.gradient.energy;

  const handleThemeTest = async () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    await changeTheme(nextTheme, true);
    Alert.alert('Theme Changed', `Switched to ${nextTheme} mode with animation`);
  };

  const handleVariantTest = () => {
    const variants = ['subtle', 'medium', 'strong', 'modal'];
    const currentIndex = variants.indexOf(selectedVariant);
    const nextVariant = variants[(currentIndex + 1) % variants.length];
    setSelectedVariant(nextVariant);
  };

  return (
    <LinearGradient
      colors={testGradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <GlassContainer variant="strong" style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Glassmorphism Test Suite
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Theme: {themeMode} | Variant: {selectedVariant}
          </Text>
          <Text style={[styles.accessibility, { color: theme.textTertiary }]}>
            Contrast Ratio: {glassAccessibility.contrastRatio.toFixed(1)} 
            {glassAccessibility.isAccessible ? ' ✅' : ' ❌'}
          </Text>
        </GlassContainer>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <GlassButton
            title="Toggle Theme"
            onPress={handleThemeTest}
            variant="medium"
            size="md"
            style={styles.controlButton}
          />
          <GlassButton
            title="Change Variant"
            onPress={handleVariantTest}
            variant={selectedVariant}
            size="md"
            style={styles.controlButton}
          />
          <GlassButton
            title="Show Modal"
            onPress={() => setModalVisible(true)}
            variant="strong"
            size="md"
            style={styles.controlButton}
          />
        </View>

        {/* Glass Card Variants */}
        <View style={styles.cardsContainer}>
          {['subtle', 'medium', 'strong'].map((variant) => (
            <GlassCard
              key={variant}
              title={`${variant.charAt(0).toUpperCase() + variant.slice(1)} Glass`}
              subtitle={`Testing ${variant} intensity blur`}
              variant={variant}
              style={styles.testCard}
              onPress={() => Alert.alert('Card Pressed', `${variant} card was pressed`)}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                Tap to test interaction • {variant} blur intensity
              </Text>
            </GlassCard>
          ))}
        </View>

        {/* Blur Wrapper Test */}
        <View style={styles.blurTestContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Direct Blur Wrapper Test
          </Text>
          <BlurWrapper
            intensity="medium"
            style={styles.blurTest}
          >
            <View style={styles.blurContent}>
              <Text style={{ color: theme.text, textAlign: 'center' }}>
                Direct BlurView Component Test
              </Text>
              <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 12 }}>
                This tests the raw blur wrapper functionality
              </Text>
            </View>
          </BlurWrapper>
        </View>

        {/* Platform Information */}
        <GlassContainer variant="subtle" style={styles.platformInfo}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Platform Information
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
            {`Platform: ${require('react-native').Platform.OS}`}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
            {`Version: ${require('react-native').Platform.Version}`}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
            Blur Support: {require('react-native').Platform.OS !== 'android' || 
                          require('react-native').Platform.Version >= 23 ? 'Yes' : 'Limited'}
          </Text>
        </GlassContainer>

        {/* Test Modal */}
        <GlassModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          variant="modal"
        >
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Glass Modal Test
            </Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              This modal demonstrates the glassmorphism modal component with 
              backdrop blur and proper contrast ratios for accessibility.
            </Text>
            <GlassButton
              title="Close Modal"
              onPress={() => setModalVisible(false)}
              variant="medium"
              size="lg"
              style={styles.modalButton}
            />
          </View>
        </GlassModal>

        {/* Back Button */}
        {navigation && (
          <GlassButton
            title="← Back to App"
            onPress={() => navigation.goBack()}
            variant="medium"
            size="lg"
            style={styles.backButton}
          />
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  accessibility: {
    fontSize: 12,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  controlButton: {
    flex: 1,
    minWidth: 100,
    marginHorizontal: 4,
  },
  cardsContainer: {
    marginBottom: 24,
  },
  testCard: {
    marginBottom: 16,
  },
  blurTestContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  blurTest: {
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  blurContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  platformInfo: {
    marginBottom: 24,
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    minWidth: 120,
  },
  backButton: {
    marginTop: 16,
    alignSelf: 'center',
    minWidth: 150,
  },
});