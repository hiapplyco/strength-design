import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, themedStyles } from '../contexts/ThemeContext';
import { GlassCard, GlassContainer } from '../components/GlassmorphismComponents';
import { colors } from '../utils/designTokens';

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  
  // Theme-aware styles using themedStyles hook
  const containerStyles = themedStyles(({ theme }) => ({
    flex: 1,
    backgroundColor: 'transparent',
  }));
  
  const headerStyles = themedStyles(({ theme, spacing, typography }) => ({
    paddingTop: 60,
    paddingBottom: spacing[6] || 24,
    paddingHorizontal: spacing[4] || 16,
    alignItems: 'center',
  }));
  
  const welcomeTextStyles = themedStyles(({ theme, typography }) => ({
    color: theme.textOnGlass,
    fontSize: typography?.fontSize?.lg || 17,
    fontWeight: typography?.fontWeight?.medium || '500',
    textAlign: 'center',
    textShadowColor: theme.isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  }));
  
  const logoStyles = themedStyles(({ theme, typography }) => ({
    fontSize: typography?.fontSize?.['4xl'] || 34,
    fontWeight: typography?.fontWeight?.bold || 'bold',
    color: theme.textOnGlass,
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: theme.isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  }));
  
  const contentStyles = themedStyles(({ spacing }) => ({
    padding: spacing[4] || 16,
    paddingBottom: 120, // Account for tab bar
  }));
  
  const cardTitleStyles = themedStyles(({ theme, typography }) => ({
    fontSize: typography?.fontSize?.xl || 19,
    fontWeight: typography?.fontWeight?.semibold || '600',
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
  }));
  
  const cardTextStyles = themedStyles(({ theme, typography }) => ({
    fontSize: typography?.fontSize?.sm || 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
    textAlign: 'center',
  }));
  
  const cardTitleDarkStyles = themedStyles(({ theme, typography }) => ({
    fontSize: typography?.fontSize?.xl || 19,
    fontWeight: typography?.fontWeight?.semibold || '600',
    color: theme.textOnGlass,
    marginTop: 10,
    textAlign: 'center',
  }));
  
  const cardTextDarkStyles = themedStyles(({ theme, typography }) => ({
    fontSize: typography?.fontSize?.sm || 13,
    color: theme.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  }));
  
  const statsContainerStyles = themedStyles(({ spacing }) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[5] || 20,
    gap: spacing[2] || 8,
  }));
  
  const statNumberStyles = themedStyles(({ theme, typography }) => ({
    fontSize: typography?.fontSize?.['2xl'] || 22,
    fontWeight: typography?.fontWeight?.bold || 'bold',
    color: theme.primary,
    textAlign: 'center',
  }));
  
  const statLabelStyles = themedStyles(({ theme, typography }) => ({
    fontSize: typography?.fontSize?.xs || 11,
    color: theme.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: typography?.fontWeight?.medium || '500',
  }));

  return (
    <ScrollView style={containerStyles} showsVerticalScrollIndicator={false}>
      {/* Enhanced Welcome Header */}
      <View style={headerStyles}>
        <Text style={welcomeTextStyles}>Welcome to</Text>
        <Text style={logoStyles}>💪 Strength.Design</Text>
      </View>

      <View style={contentStyles}>
        {/* AI Generation Card - Featured with gradient */}
        <GlassCard
          variant="strong"
          style={{ marginBottom: 16 }}
          onPress={() => navigation.navigate('Generator')}
          accessible={true}
          accessibilityLabel="Generate AI workout"
          accessibilityHint="Create a personalized workout using AI"
        >
          <LinearGradient
            colors={theme.isDarkMode ? colors.gradients.accent.dark.aurora : colors.gradients.accent.light.sunset}
            style={{
              padding: 20,
              alignItems: 'center',
              borderRadius: 12,
              margin: -16, // Negative margin to fill card
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="sparkles" size={40} color="white" />
            <Text style={cardTitleStyles}>Generate Workout</Text>
            <Text style={cardTextStyles}>AI-powered workout creation</Text>
          </LinearGradient>
        </GlassCard>

        {/* My Workouts Card */}
        <GlassCard
          variant="medium"
          style={{ marginBottom: 16 }}
          onPress={() => navigation.navigate('Workouts')}
          accessible={true}
          accessibilityLabel="My workouts"
          accessibilityHint="View your saved workout plans"
        >
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Ionicons 
              name="calendar" 
              size={40} 
              color={theme.theme.primary} 
              style={{
                textShadowColor: theme.isDarkMode ? 'rgba(255,184,107,0.3)' : 'rgba(255,107,53,0.3)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
              }}
            />
            <Text style={cardTitleDarkStyles}>My Workouts</Text>
            <Text style={cardTextDarkStyles}>View saved workout plans</Text>
          </View>
        </GlassCard>

        {/* Exercise Library Card */}
        <GlassCard
          variant="medium"
          style={{ marginBottom: 24 }}
          onPress={() => navigation.navigate('Exercises')}
          accessible={true}
          accessibilityLabel="Exercise library"
          accessibilityHint="Browse over 800 exercises"
        >
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Ionicons 
              name="library" 
              size={40} 
              color={theme.theme.primary}
              style={{
                textShadowColor: theme.isDarkMode ? 'rgba(255,184,107,0.3)' : 'rgba(255,107,53,0.3)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
              }}
            />
            <Text style={cardTitleDarkStyles}>Exercise Library</Text>
            <Text style={cardTextDarkStyles}>Browse 800+ exercises</Text>
          </View>
        </GlassCard>

        {/* Statistics Cards */}
        <View style={statsContainerStyles}>
          {[
            { label: 'Workouts', value: '0', icon: 'barbell' },
            { label: 'Exercises', value: '0', icon: 'fitness' },
            { label: 'Minutes', value: '0', icon: 'time' }
          ].map((stat, index) => (
            <GlassCard
              key={stat.label}
              variant="subtle"
              style={{ 
                flex: 1,
                marginHorizontal: index === 1 ? 4 : 0, // Add spacing for middle card
              }}
              accessible={true}
              accessibilityLabel={`${stat.value} ${stat.label.toLowerCase()}`}
            >
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Ionicons 
                  name={stat.icon} 
                  size={18} 
                  color={theme.theme.textTertiary} 
                  style={{ marginBottom: 4 }}
                />
                <Text style={statNumberStyles}>{stat.value}</Text>
                <Text style={statLabelStyles}>{stat.label}</Text>
              </View>
            </GlassCard>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  cardContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  cardTitleDark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  cardText: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
  },
  cardTextDark: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
  },
});