/**
 * GlobalContextButton Component
 * A floating action button that provides quick access to the context modal from any screen
 * 
 * Features:
 * - Floating position with glassmorphism effect
 * - Shows user's fitness level/streak badge
 * - Animated pulse effect for engagement
 * - Works across all screens
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import ContextModal from './ContextModal';
import { useTheme } from '../contexts/ThemeContext';
import { SafeLinearGradient } from './SafeLinearGradient';

export default function GlobalContextButton({ navigation, style, position = 'bottom-right' }) {
  const [showContextModal, setShowContextModal] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [hasVisitedProfile, setHasVisitedProfile] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { isDarkMode } = useTheme();

  useEffect(() => {
    loadUserStats();
    checkProfileVisit();
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);
  
  const checkProfileVisit = async () => {
    try {
      const visited = await AsyncStorage.getItem('hasVisitedProfile');
      setHasVisitedProfile(visited === 'true');
    } catch (error) {
      console.error('Error checking profile visit:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get user preferences
      const savedPreferences = await AsyncStorage.getItem('userPreferences');
      const preferences = savedPreferences ? JSON.parse(savedPreferences) : {};

      // Get workout streak
      const workoutsQuery = query(
        collection(db, 'dailyWorkouts'),
        where('userId', '==', user.uid),
        where('completed', '==', true)
      );
      
      const snapshot = await getDocs(workoutsQuery);
      const streak = calculateStreak(snapshot.docs);

      setUserStats({
        fitnessLevel: preferences.fitnessLevel,
        streak,
        hasContext: !!preferences.fitnessLevel,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const calculateStreak = (workoutDocs) => {
    let streak = 0;
    const today = new Date();
    const sortedDocs = workoutDocs.sort((a, b) => 
      b.data().completedAt?.toDate() - a.data().completedAt?.toDate()
    );

    for (const doc of sortedDocs) {
      const completedDate = doc.data().completedAt?.toDate();
      if (!completedDate) continue;
      
      const daysDiff = Math.floor((today - completedDate) / (1000 * 60 * 60 * 24));
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return { top: Platform.OS === 'ios' ? 95 : 75, right: 15 };
      case 'top-left':
        return { top: Platform.OS === 'ios' ? 95 : 75, left: 15 };
      case 'bottom-left':
        return { bottom: 100, left: 15 };
      case 'bottom-right':
      default:
        return { bottom: 100, right: 15 };
    }
  };

  // Don't show button if user has no context but has already visited profile
  if (!userStats?.hasContext && hasVisitedProfile) {
    return null;
  }

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          getPositionStyles(),
          {
            opacity: fadeAnim,
            transform: [{ scale: pulseAnim }],
          },
          style,
        ]}
      >
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={async () => {
              if (!userStats?.hasContext) {
                // First time - go directly to profile
                await AsyncStorage.setItem('hasVisitedProfile', 'true');
                setHasVisitedProfile(true);
                if (navigation && navigation.navigate) {
                  navigation.navigate('Profile');
                }
              } else {
                // Has context - show modal
                setShowContextModal(true);
              }
            }}
            activeOpacity={0.9}
          >
            <BlurView
              intensity={80}
              tint={isDarkMode ? 'dark' : 'light'}
              style={StyleSheet.absoluteFillObject}
            />
            
            {/* Enhanced Neon Border Ring */}
            <View style={styles.neonRing} />
            <View style={styles.neonRingOuter} />
            
            <SafeLinearGradient
              colors={userStats?.hasContext 
                ? ['#FF6B35', '#FF8F65'] 
                : ['#666666', '#888888']
              }
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={userStats?.hasContext ? "person-circle" : "person-circle-outline"} 
                  size={28} 
                  color="#FFFFFF" 
                />
                {userStats?.streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakText}>🔥{userStats.streak}</Text>
                  </View>
                )}
              </View>
            </SafeLinearGradient>
          </TouchableOpacity>

          {/* Text beside the button */}
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>Your Profile</Text>
            {!userStats?.hasContext && (
              <Text style={styles.labelSubtext}>Tap to set up</Text>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Context Modal */}
      <ContextModal
        visible={showContextModal}
        onClose={() => setShowContextModal(false)}
        onNavigate={(screen) => {
          setShowContextModal(false);
          if (navigation && navigation.navigate) {
            navigation.navigate(screen);
          }
        }}
        title="Your Fitness Context"
        subtitle="Track your progress and get personalized workouts"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
  },
  streakBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  streakText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelContainer: {
    justifyContent: 'center',
    marginLeft: 12,
  },
  labelText: {
    color: '#00FFFF',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  labelSubtext: {
    color: '#00FFFF',
    fontSize: 11,
    opacity: 0.8,
    marginTop: 2,
  },
  neonRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#00FFFF',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
  },
  neonRingOuter: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#00FFFF',
    opacity: 0.3,
    left: -4,
    top: -4,
  },
});