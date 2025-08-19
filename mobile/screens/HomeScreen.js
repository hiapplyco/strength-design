import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function HomeScreen({ navigation }) {
  console.log('NEW HOMESCREEN LOADED - REDESIGNED VERSION');
  const theme = useTheme();
  
  const features = [
    {
      icon: 'sparkles',
      title: 'AI Workout Generation',
      description: 'Create personalized workouts using advanced AI that adapts to your fitness level and goals',
      action: 'Generator',
      color: '#4CAF50'
    },
    {
      icon: 'search',
      title: 'Smart Exercise Search',
      description: 'Find exercises from our database of 800+ movements with natural language search',
      action: 'Search',
      color: '#2196F3'
    },
    {
      icon: 'calendar',
      title: 'Workout Management',
      description: 'Save, organize, and track your workouts with offline support and cloud sync',
      action: 'Workouts',
      color: '#9C27B0'
    },
    {
      icon: 'fitness',
      title: 'Exercise Library',
      description: 'Browse detailed exercise instructions with proper form and technique guidance',
      action: 'Exercises',
      color: '#FF9800'
    }
  ];

  const steps = [
    { number: '1', text: 'Start with AI Generator to create your first workout' },
    { number: '2', text: 'Customize exercises using the search feature' },
    { number: '3', text: 'Save your workouts for quick access' },
    { number: '4', text: 'Track your progress and stay consistent' }
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.isDarkMode ? '#0A0A0A' : '#FAFAFA' }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: theme.isDarkMode ? '#0A0A0A' : '#FAFAFA' }]}>
        <Text style={[styles.welcomeText, { color: theme.isDarkMode ? '#888' : '#666' }]}>
          Welcome to
        </Text>
        <Text style={[styles.appTitle, { color: theme.isDarkMode ? '#FFF' : '#333' }]}>
          💪 Strength.Design
        </Text>
        <Text style={[styles.subtitle, { color: theme.isDarkMode ? '#AAA' : '#666' }]}>
          Your AI-Powered Fitness Companion
        </Text>
      </View>

      {/* How It Works Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.isDarkMode ? '#FFF' : '#333' }]}>
          How It Works
        </Text>
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.isDarkMode ? '#1A1A1A' : '#FFF' }]}>
                <Text style={[styles.stepNumberText, { color: '#4CAF50' }]}>
                  {step.number}
                </Text>
              </View>
              <Text style={[styles.stepText, { color: theme.isDarkMode ? '#CCC' : '#555' }]}>
                {step.text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Features Grid */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.isDarkMode ? '#FFF' : '#333' }]}>
          Features
        </Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.featureCard,
                { 
                  backgroundColor: theme.isDarkMode ? '#1A1A1A' : '#FFF',
                  borderColor: theme.isDarkMode ? '#333' : '#E0E0E0'
                }
              ]}
              onPress={() => navigation.navigate(feature.action)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${feature.color}15` }]}>
                <Ionicons name={feature.icon} size={28} color={feature.color} />
              </View>
              <Text style={[styles.featureTitle, { color: theme.isDarkMode ? '#FFF' : '#333' }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: theme.isDarkMode ? '#AAA' : '#666' }]}>
                {feature.description}
              </Text>
              <View style={styles.featureArrow}>
                <Ionicons 
                  name="arrow-forward-circle" 
                  size={24} 
                  color={feature.color} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={[styles.quickActions, { backgroundColor: theme.isDarkMode ? '#1A1A1A' : '#FFF' }]}>
        <Text style={[styles.quickActionsTitle, { color: theme.isDarkMode ? '#FFF' : '#333' }]}>
          Ready to Start?
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => navigation.navigate('Generator')}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={20} color="#FFF" />
          <Text style={styles.primaryButtonText}>Generate Your First Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Preview */}
      <View style={styles.statsContainer}>
        <View style={[styles.statItem, { backgroundColor: theme.isDarkMode ? '#1A1A1A' : '#FFF' }]}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>873+</Text>
          <Text style={[styles.statLabel, { color: theme.isDarkMode ? '#AAA' : '#666' }]}>
            Exercises
          </Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: theme.isDarkMode ? '#1A1A1A' : '#FFF' }]}>
          <Text style={[styles.statNumber, { color: '#2196F3' }]}>AI</Text>
          <Text style={[styles.statLabel, { color: theme.isDarkMode ? '#AAA' : '#666' }]}>
            Powered
          </Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: theme.isDarkMode ? '#1A1A1A' : '#FFF' }]}>
          <Text style={[styles.statNumber, { color: '#9C27B0' }]}>100%</Text>
          <Text style={[styles.statLabel, { color: theme.isDarkMode ? '#AAA' : '#666' }]}>
            Offline
          </Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  stepsContainer: {
    gap: 15,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  featuresGrid: {
    gap: 15,
  },
  featureCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  featureArrow: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  quickActions: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 15,
  },
  statItem: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 5,
  },
});