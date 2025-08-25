import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { GlassContainer } from '../components/GlassmorphismComponents';
import { SafeLinearGradient } from '../components/SafeLinearGradient';
import { AppLogo } from '../components/AppLogo';
import GlobalContextButton from '../components/GlobalContextButton';
import GlobalContextStatusLine from '../components/GlobalContextStatusLine';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const neonAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Neon pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(neonAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(neonAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);
  
  const quickActions = [
    {
      icon: 'sparkles',
      title: 'AI Coach',
      subtitle: 'Personalized workouts',
      action: 'Generator',
      gradient: ['#FF6B35', '#FF8F65']
    },
    {
      icon: 'search',
      title: 'Search',
      subtitle: '800+ exercises',
      action: 'Search',
      gradient: ['#4CAF50', '#66BB6A']
    },
    {
      icon: 'analytics',
      title: 'Form Analysis',
      subtitle: 'AI-powered feedback',
      action: 'PoseAnalysisUpload',
      gradient: ['#9C27B0', '#BA68C8']
    },
    {
      icon: 'calendar',
      title: 'Workouts',
      subtitle: 'Your programs',
      action: 'Workouts',
      gradient: ['#2196F3', '#42A5F5']
    }
  ];

  return (
    <SafeLinearGradient
      colors={theme.isDarkMode 
        ? ['#000000', '#0A0A0A', '#141414']
        : ['#FFFFFF', '#F8F9FA', '#F0F1F3']
      }
      style={styles.container}
    >
      {/* Global Context Status Line */}
      <GlobalContextStatusLine navigation={navigation} />
      
      <View style={styles.content}>
        {/* Hero Section with Logo */}
        <View style={styles.heroSection}>
          <AppLogo 
            size={200}  // Make logo bigger
            showGlow={false}
            noCircle={true}
            style={styles.logo}
          />
          
          <View style={styles.titleContainer}>
            <Animated.Text style={[
              styles.appName,
              {
                color: neonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#00FFFF', '#FF00FF'],
                }),
                textShadowColor: neonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#00FFFF', '#FF00FF'],
                }),
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: neonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [25, 40], // Increased blur effect
                }),
              }
            ]}>
              STRENGTH.DESIGN
            </Animated.Text>
            {/* Removed neon outline - keeping just the glow effect */}
          </View>
          
          <Text style={[styles.tagline, { color: theme.isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
            AI-Powered Fitness Companion
          </Text>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionItem}
                onPress={() => navigation.navigate(action.action)}
                activeOpacity={0.7}
              >
                <GlassContainer
                  variant="subtle"
                  style={styles.actionCard}
                  showShadow={false}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons 
                      name={action.icon} 
                      size={32} 
                      color={action.gradient[0]} 
                    />
                  </View>
                  
                  <Text style={[styles.actionTitle, { color: theme.isDarkMode ? '#FFF' : '#000' }]}>
                    {action.title}
                  </Text>
                  
                  <Text style={[styles.actionSubtitle, { color: theme.isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}>
                    {action.subtitle}
                  </Text>
                </GlassContainer>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Primary CTA Button */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Generator')}
            activeOpacity={0.8}
          >
            <SafeLinearGradient
              colors={['#FF6B35', '#FF8F65']}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="sparkles" size={20} color="#FFF" style={styles.ctaIcon} />
              <Text style={styles.ctaText}>Start Your Journey</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </SafeLinearGradient>
          </TouchableOpacity>
          
          <Text style={[styles.ctaHint, { color: theme.isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
            Get personalized AI workout recommendations
          </Text>
        </View>
      </View>
      
      {/* Global Context Button - moved to top right */}
      <GlobalContextButton navigation={navigation} position="top-right" />
    </SafeLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 90,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: screenHeight * 0.01,
  },
  logo: {
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif-black',
      default: 'System',
    }),
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
  },
  titleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 30,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  actionItem: {
    width: '47%',
    marginBottom: 15,
  },
  actionCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  actionIconContainer: {
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  ctaContainer: {
    paddingBottom: 20,
  },
  ctaButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 12,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  ctaIcon: {
    marginRight: 8,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  ctaHint: {
    fontSize: 13,
    textAlign: 'center',
  },
});