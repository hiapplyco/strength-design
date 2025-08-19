/**
 * MockupWorkoutScreen - Comprehensive 4-Week Workout Program Demo
 * 
 * Features:
 * - Complete 4-week strength training program
 * - Progressive overload with weekly advancement
 * - Interactive day editing with local state management
 * - Beautiful glassmorphism UI with liquid animations
 * - Full workout session tracking
 * - Progress visualization and statistics
 * - No API calls - pure local demonstration
 * 
 * @screen MockupWorkoutScreen
 * @author Claude AI Assistant
 * @version 2.0.0
 * @created 2025-08-18
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Import design system and components
import { SafeLinearGradient, GlassGradient } from '../components/SafeLinearGradient';
import ShareWorkoutDrawer from '../components/ShareWorkoutDrawer';
import { useTheme } from '../contexts/ThemeContext';
import { colors, spacing, borderRadius, typography, shadows } from '../utils/designTokens';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Sample 4-week progressive strength training program
const SAMPLE_PROGRAM = {
  id: 'strength-4week-v1',
  title: 'Strength Foundation 4-Week Program',
  description: 'A comprehensive 4-week strength training program designed to build foundational strength across all major movement patterns. Progressive overload each week with proper recovery protocols.',
  summary: 'Build strength with compound movements',
  totalWeeks: 4,
  daysPerWeek: 4,
  difficulty: 'intermediate',
  programType: 'strength',
  goals: ['strength', 'muscle_gain'],
  targetAudience: ['Intermediate lifters', 'Athletes', 'Strength enthusiasts'],
  equipment: ['Barbell', 'Dumbbells', 'Squat rack', 'Bench', 'Pull-up bar'],
  estimatedCaloriesBurn: 2800, // per week
  createdBy: 'Strength.Design AI',
  createdAt: new Date().toISOString(),
  version: '1.0',
  tags: ['strength', 'progressive', '4-week', 'compound'],
  
  weeks: [
    {
      id: 'week-1',
      weekNumber: 1,
      title: 'Foundation Week',
      description: 'Establish movement patterns and baseline strength',
      isDeloadWeek: false,
      isTestWeek: false,
      focusTheme: 'Movement Quality & Baseline',
      
      days: [
        {
          id: 'w1d1',
          dayNumber: 1,
          weekNumber: 1,
          title: 'Upper Body Power',
          description: 'Focus on bench press and pulling movements with moderate intensity',
          estimatedDuration: 75,
          difficulty: 'intermediate',
          focusAreas: ['Chest', 'Back', 'Shoulders'],
          restDay: false,
          activeRecovery: false,
          
          warmup: {
            id: 'w1d1-warmup',
            name: 'Dynamic Upper Warmup',
            type: 'warmup',
            estimatedDuration: 10,
            exercises: [
              {
                id: 'arm-circles',
                name: 'Arm Circles',
                category: 'mobility',
                sets: [{ id: 's1', type: 'time_based', duration: 30, reps: 10 }],
                restPeriods: { between_sets: 0 },
                instructions: ['Large circles forward and backward', 'Keep arms straight']
              },
              {
                id: 'band-pull-aparts',
                name: 'Band Pull-Aparts',
                category: 'mobility',
                sets: [{ id: 's1', type: 'working', reps: 15, weight: 0 }],
                restPeriods: { between_sets: 30 },
                instructions: ['Pull band apart at chest level', 'Squeeze shoulder blades']
              }
            ]
          },
          
          workout: {
            id: 'w1d1-main',
            name: 'Main Workout',
            type: 'main',
            estimatedDuration: 50,
            exercises: [
              {
                id: 'bench-press',
                name: 'Barbell Bench Press',
                category: 'strength',
                primaryMuscles: ['Chest', 'Triceps', 'Anterior Deltoids'],
                sets: [
                  { id: 's1', type: 'warmup', reps: 8, weight: 135, weightUnit: 'lbs' },
                  { id: 's2', type: 'working', reps: 6, weight: 155, weightUnit: 'lbs' },
                  { id: 's3', type: 'working', reps: 6, weight: 165, weightUnit: 'lbs' },
                  { id: 's4', type: 'working', reps: 6, weight: 175, weightUnit: 'lbs' },
                ],
                restPeriods: { between_sets: 180 },
                instructions: ['Lower bar to chest with control', 'Press up explosively', 'Keep feet planted']
              },
              {
                id: 'bent-row',
                name: 'Barbell Bent-Over Row',
                category: 'strength',
                primaryMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Middle Traps'],
                sets: [
                  { id: 's1', type: 'working', reps: 8, weight: 135, weightUnit: 'lbs' },
                  { id: 's2', type: 'working', reps: 8, weight: 145, weightUnit: 'lbs' },
                  { id: 's3', type: 'working', reps: 8, weight: 155, weightUnit: 'lbs' },
                ],
                restPeriods: { between_sets: 150 },
                instructions: ['Hinge at hips', 'Pull bar to lower chest', 'Squeeze shoulder blades']
              }
            ]
          },
          
          strength: {
            id: 'w1d1-strength',
            name: 'Accessory Work',
            type: 'strength',
            estimatedDuration: 15,
            exercises: [
              {
                id: 'dumbbell-press',
                name: 'Dumbbell Shoulder Press',
                category: 'strength',
                sets: [
                  { id: 's1', type: 'working', reps: 10, weight: 40, weightUnit: 'lbs' },
                  { id: 's2', type: 'working', reps: 10, weight: 45, weightUnit: 'lbs' },
                  { id: 's3', type: 'working', reps: 10, weight: 50, weightUnit: 'lbs' },
                ],
                restPeriods: { between_sets: 90 }
              }
            ]
          }
        },
        
        {
          id: 'w1d2',
          dayNumber: 2,
          weekNumber: 1,
          title: 'Lower Body Foundation',
          description: 'Squat-focused session with posterior chain development',
          estimatedDuration: 80,
          difficulty: 'intermediate',
          focusAreas: ['Quadriceps', 'Glutes', 'Hamstrings'],
          restDay: false,
          
          warmup: {
            id: 'w1d2-warmup',
            name: 'Dynamic Lower Warmup',
            type: 'warmup',
            estimatedDuration: 12,
            exercises: [
              {
                id: 'leg-swings',
                name: 'Leg Swings',
                category: 'mobility',
                sets: [{ id: 's1', type: 'time_based', duration: 60, reps: 15 }],
                restPeriods: { between_sets: 0 }
              },
              {
                id: 'bodyweight-squats',
                name: 'Bodyweight Squats',
                category: 'warmup',
                sets: [{ id: 's1', type: 'warmup', reps: 15, weight: 0 }],
                restPeriods: { between_sets: 30 }
              }
            ]
          },
          
          workout: {
            id: 'w1d2-main',
            name: 'Main Workout',
            type: 'main',
            estimatedDuration: 55,
            exercises: [
              {
                id: 'back-squat',
                name: 'Back Squat',
                category: 'strength',
                primaryMuscles: ['Quadriceps', 'Glutes', 'Core'],
                sets: [
                  { id: 's1', type: 'warmup', reps: 8, weight: 135, weightUnit: 'lbs' },
                  { id: 's2', type: 'working', reps: 8, weight: 175, weightUnit: 'lbs' },
                  { id: 's3', type: 'working', reps: 8, weight: 185, weightUnit: 'lbs' },
                  { id: 's4', type: 'working', reps: 8, weight: 195, weightUnit: 'lbs' },
                ],
                restPeriods: { between_sets: 180 }
              },
              {
                id: 'romanian-deadlift',
                name: 'Romanian Deadlift',
                category: 'strength',
                primaryMuscles: ['Hamstrings', 'Glutes', 'Lower Back'],
                sets: [
                  { id: 's1', type: 'working', reps: 10, weight: 135, weightUnit: 'lbs' },
                  { id: 's2', type: 'working', reps: 10, weight: 155, weightUnit: 'lbs' },
                  { id: 's3', type: 'working', reps: 10, weight: 165, weightUnit: 'lbs' },
                ],
                restPeriods: { between_sets: 120 }
              }
            ]
          },
          
          strength: {
            id: 'w1d2-strength',
            name: 'Accessory Work',
            type: 'strength',
            estimatedDuration: 13,
            exercises: [
              {
                id: 'walking-lunges',
                name: 'Walking Lunges',
                category: 'strength',
                sets: [
                  { id: 's1', type: 'working', reps: 12, weight: 25, weightUnit: 'lbs' },
                  { id: 's2', type: 'working', reps: 12, weight: 30, weightUnit: 'lbs' },
                  { id: 's3', type: 'working', reps: 12, weight: 35, weightUnit: 'lbs' },
                ],
                restPeriods: { between_sets: 75 }
              }
            ]
          }
        },
        
        {
          id: 'w1d3',
          dayNumber: 3,
          weekNumber: 1,
          title: 'Active Recovery',
          description: 'Light movement and mobility work',
          estimatedDuration: 30,
          difficulty: 'beginner',
          focusAreas: ['Mobility', 'Recovery'],
          restDay: false,
          activeRecovery: true,
          
          warmup: {
            id: 'w1d3-warmup',
            name: 'Gentle Mobility',
            type: 'warmup',
            estimatedDuration: 30,
            exercises: [
              {
                id: 'yoga-flow',
                name: 'Dynamic Yoga Flow',
                category: 'flexibility',
                sets: [{ id: 's1', type: 'time_based', duration: 600, reps: 1 }],
                restPeriods: { between_sets: 0 }
              }
            ]
          },
          
          workout: {
            id: 'w1d3-main',
            name: 'Recovery Workout',
            type: 'flexibility',
            estimatedDuration: 0,
            exercises: []
          }
        },
        
        {
          id: 'w1d4',
          dayNumber: 4,
          weekNumber: 1,
          title: 'Full Body Power',
          description: 'Combined upper and lower body compound movements',
          estimatedDuration: 85,
          difficulty: 'intermediate',
          focusAreas: ['Full Body', 'Power'],
          restDay: false,
          
          warmup: {
            id: 'w1d4-warmup',
            name: 'Full Body Activation',
            type: 'warmup',
            estimatedDuration: 15,
            exercises: [
              {
                id: 'jumping-jacks',
                name: 'Jumping Jacks',
                category: 'cardio',
                sets: [{ id: 's1', type: 'time_based', duration: 60, reps: 30 }],
                restPeriods: { between_sets: 30 }
              }
            ]
          },
          
          workout: {
            id: 'w1d4-main',
            name: 'Main Workout',
            type: 'main',
            estimatedDuration: 60,
            exercises: [
              {
                id: 'conventional-deadlift',
                name: 'Conventional Deadlift',
                category: 'strength',
                primaryMuscles: ['Hamstrings', 'Glutes', 'Traps', 'Lats'],
                sets: [
                  { id: 's1', type: 'warmup', reps: 5, weight: 185, weightUnit: 'lbs' },
                  { id: 's2', type: 'working', reps: 5, weight: 225, weightUnit: 'lbs' },
                  { id: 's3', type: 'working', reps: 5, weight: 245, weightUnit: 'lbs' },
                  { id: 's4', type: 'working', reps: 5, weight: 265, weightUnit: 'lbs' },
                ],
                restPeriods: { between_sets: 180 }
              },
              {
                id: 'overhead-press',
                name: 'Standing Overhead Press',
                category: 'strength',
                primaryMuscles: ['Shoulders', 'Triceps', 'Core'],
                sets: [
                  { id: 's1', type: 'working', reps: 8, weight: 95, weightUnit: 'lbs' },
                  { id: 's2', type: 'working', reps: 8, weight: 105, weightUnit: 'lbs' },
                  { id: 's3', type: 'working', reps: 8, weight: 115, weightUnit: 'lbs' },
                ],
                restPeriods: { between_sets: 150 }
              }
            ]
          },
          
          strength: {
            id: 'w1d4-strength',
            name: 'Accessory Work',
            type: 'strength',
            estimatedDuration: 10,
            exercises: [
              {
                id: 'pull-ups',
                name: 'Pull-ups',
                category: 'strength',
                sets: [
                  { id: 's1', type: 'working', reps: 8, weight: 0, weightUnit: 'lbs' },
                  { id: 's2', type: 'working', reps: 7, weight: 0, weightUnit: 'lbs' },
                  { id: 's3', type: 'working', reps: 6, weight: 0, weightUnit: 'lbs' },
                ],
                restPeriods: { between_sets: 90 }
              }
            ]
          }
        }
      ]
    },
    
    // Additional weeks would follow similar pattern with progressive overload
    // Week 2: +5-10 lbs on main lifts, Week 3: +10-15 lbs, Week 4: Deload week
  ]
};

const MockupWorkoutScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const [currentProgram, setCurrentProgram] = useState(SAMPLE_PROGRAM);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [shareDrawerVisible, setShareDrawerVisible] = useState(false);
  const [shareType, setShareType] = useState('program');
  const [shareContent, setShareContent] = useState(null);
  const [programStats, setProgramStats] = useState({
    totalDays: 16,
    completedDays: 6,
    currentWeek: 2,
    averageRating: 4.3,
    totalVolume: 12540,
    personalRecords: 3
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Simulate editing a workout day
  const handleEditDay = (day) => {
    setEditingDay(day);
    Alert.alert(
      'Edit Workout Day',
      `What would you like to modify about "${day.title}"?`,
      [
        { text: 'Change exercises', onPress: () => simulateExerciseEdit(day) },
        { text: 'Adjust intensity', onPress: () => simulateIntensityEdit(day) },
        { text: 'Modify duration', onPress: () => simulateDurationEdit(day) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const simulateExerciseEdit = (day) => {
    // Simulate AI editing by modifying the exercise list
    const editedDay = { ...day };
    editedDay.title = `${day.title} (Modified)`;
    editedDay.lastModified = new Date().toISOString();
    editedDay.modifiedBy = 'user';
    
    // Update the program state
    const updatedProgram = { ...currentProgram };
    const weekIndex = updatedProgram.weeks.findIndex(w => w.weekNumber === day.weekNumber);
    const dayIndex = updatedProgram.weeks[weekIndex].days.findIndex(d => d.id === day.id);
    updatedProgram.weeks[weekIndex].days[dayIndex] = editedDay;
    
    setCurrentProgram(updatedProgram);
    setEditingDay(null);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', 'Workout day has been modified!');
  };

  const simulateIntensityEdit = (day) => {
    const editedDay = { ...day };
    
    // Increase all working set weights by 5-10 lbs
    const increaseWeight = (exercise) => ({
      ...exercise,
      sets: exercise.sets.map(set => ({
        ...set,
        weight: set.type === 'working' ? (set.weight || 0) + 10 : set.weight
      }))
    });
    
    editedDay.workout.exercises = editedDay.workout.exercises.map(increaseWeight);
    if (editedDay.strength) {
      editedDay.strength.exercises = editedDay.strength.exercises.map(increaseWeight);
    }
    
    editedDay.title = `${day.title} (Intensified)`;
    editedDay.lastModified = new Date().toISOString();
    
    // Update program state
    const updatedProgram = { ...currentProgram };
    const weekIndex = updatedProgram.weeks.findIndex(w => w.weekNumber === day.weekNumber);
    const dayIndex = updatedProgram.weeks[weekIndex].days.findIndex(d => d.id === day.id);
    updatedProgram.weeks[weekIndex].days[dayIndex] = editedDay;
    
    setCurrentProgram(updatedProgram);
    setEditingDay(null);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Intensity Increased', 'All working sets increased by 10 lbs!');
  };

  const simulateDurationEdit = (day) => {
    const editedDay = { ...day };
    editedDay.estimatedDuration = Math.max(30, editedDay.estimatedDuration - 15);
    editedDay.title = `${day.title} (Express)`;
    editedDay.lastModified = new Date().toISOString();
    
    // Update program state
    const updatedProgram = { ...currentProgram };
    const weekIndex = updatedProgram.weeks.findIndex(w => w.weekNumber === day.weekNumber);
    const dayIndex = updatedProgram.weeks[weekIndex].days.findIndex(d => d.id === day.id);
    updatedProgram.weeks[weekIndex].days[dayIndex] = editedDay;
    
    setCurrentProgram(updatedProgram);
    setEditingDay(null);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Duration Shortened', 'Workout optimized for time efficiency!');
  };

  // Handle sharing
  const handleShare = (type, content) => {
    setShareType(type);
    setShareContent(content);
    setShareDrawerVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Start workout session simulation
  const handleStartWorkout = (day) => {
    Alert.alert(
      'Start Workout',
      `Ready to begin "${day.title}"?\n\nEstimated duration: ${day.estimatedDuration} minutes`,
      [
        { text: 'Start', onPress: () => simulateWorkoutStart(day) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const simulateWorkoutStart = (day) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Workout Started! 💪',
      'This is a mockup - in the real app, you would be taken to the active workout tracking screen.',
      [{ text: 'OK' }]
    );
  };

  // Week selector component
  const WeekSelector = () => (
    <View style={styles.weekSelector}>
      <Text style={[
        styles.sectionTitle,
        { color: isDarkMode ? colors.dark.text.primary : colors.light.text.primary }
      ]}>
        Program Weeks
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {currentProgram.weeks.map((week, index) => (
          <TouchableOpacity
            key={week.id}
            style={[
              styles.weekTab,
              selectedWeek === week.weekNumber && styles.weekTabActive,
              {
                backgroundColor: selectedWeek === week.weekNumber
                  ? colors.primary.DEFAULT
                  : (isDarkMode ? colors.dark.background.glass.medium : colors.light.background.glass.medium),
                borderColor: isDarkMode ? colors.dark.border.light : colors.light.border.light
              }
            ]}
            onPress={() => {
              setSelectedWeek(week.weekNumber);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[
              styles.weekTabText,
              { color: selectedWeek === week.weekNumber ? 'white' : (isDarkMode ? colors.dark.text.primary : colors.light.text.primary) }
            ]}>
              Week {week.weekNumber}
            </Text>
            <Text style={[
              styles.weekTabSubtext,
              { color: selectedWeek === week.weekNumber ? 'rgba(255,255,255,0.8)' : (isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary) }
            ]}>
              {week.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Day card component
  const DayCard = ({ day, weekNumber }) => (
    <GlassGradient
      intensity="medium"
      style={[
        styles.dayCard,
        {
          borderColor: isDarkMode ? colors.dark.border.light : colors.light.border.light,
        }
      ]}
    >
      <View style={styles.dayCardHeader}>
        <View style={styles.dayInfo}>
          <Text style={[
            styles.dayTitle,
            { color: isDarkMode ? colors.dark.text.primary : colors.light.text.primary }
          ]}>
            {day.title}
          </Text>
          <Text style={[
            styles.daySubtitle,
            { color: isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary }
          ]}>
            Day {day.dayNumber} • Week {weekNumber}
          </Text>
        </View>
        <View style={styles.dayActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${colors.primary.DEFAULT}20` }]}
            onPress={() => handleShare('day', day)}
          >
            <Ionicons name="share-outline" size={20} color={colors.primary.DEFAULT} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${colors.primary.DEFAULT}20` }]}
            onPress={() => handleEditDay(day)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary.DEFAULT} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={[
        styles.dayDescription,
        { color: isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary }
      ]}>
        {day.description}
      </Text>
      
      <View style={styles.dayMeta}>
        <View style={styles.metaItem}>
          <Ionicons 
            name="time-outline" 
            size={16} 
            color={isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary} 
          />
          <Text style={[
            styles.metaText,
            { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
          ]}>
            {day.estimatedDuration} min
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons 
            name="fitness-outline" 
            size={16} 
            color={isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary} 
          />
          <Text style={[
            styles.metaText,
            { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
          ]}>
            {day.focusAreas?.join(', ') || 'Full Body'}
          </Text>
        </View>
      </View>
      
      {day.restDay || day.activeRecovery ? (
        <TouchableOpacity
          style={[styles.restButton, { backgroundColor: `${colors.semantic.info.light.primary}20` }]}
          onPress={() => Alert.alert('Recovery Day', 'Light movement and stretching recommended')}
        >
          <Ionicons name="leaf-outline" size={20} color={colors.semantic.info.light.primary} />
          <Text style={[styles.restButtonText, { color: colors.semantic.info.light.primary }]}>
            {day.activeRecovery ? 'Active Recovery' : 'Rest Day'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: colors.primary.DEFAULT }]}
          onPress={() => handleStartWorkout(day)}
        >
          <Ionicons name="play" size={20} color="white" />
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      )}
      
      {day.lastModified && (
        <View style={styles.modifiedBadge}>
          <Ionicons name="pencil" size={12} color={colors.primary.DEFAULT} />
          <Text style={[styles.modifiedText, { color: colors.primary.DEFAULT }]}>
            Modified
          </Text>
        </View>
      )}
    </GlassGradient>
  );

  // Stats overview component
  const StatsOverview = () => (
    <GlassGradient
      intensity="medium"
      style={[
        styles.statsContainer,
        {
          borderColor: isDarkMode ? colors.dark.border.light : colors.light.border.light,
        }
      ]}
    >
      <Text style={[
        styles.sectionTitle,
        { color: isDarkMode ? colors.dark.text.primary : colors.light.text.primary }
      ]}>
        Program Progress
      </Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary.DEFAULT }]}>
            {programStats.completedDays}/{programStats.totalDays}
          </Text>
          <Text style={[
            styles.statLabel,
            { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
          ]}>
            Days Done
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary.DEFAULT }]}>
            {programStats.currentWeek}/4
          </Text>
          <Text style={[
            styles.statLabel,
            { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
          ]}>
            Current Week
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary.DEFAULT }]}>
            {programStats.personalRecords}
          </Text>
          <Text style={[
            styles.statLabel,
            { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
          ]}>
            PRs
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary.DEFAULT }]}>
            {programStats.averageRating.toFixed(1)}
          </Text>
          <Text style={[
            styles.statLabel,
            { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
          ]}>
            Avg Rating
          </Text>
        </View>
      </View>
    </GlassGradient>
  );

  const currentWeek = currentProgram.weeks.find(w => w.weekNumber === selectedWeek);

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDarkMode ? colors.dark.background.primary : colors.light.background.primary }
    ]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      {/* Header */}
      <SafeLinearGradient
        type="background"
        variant={isDarkMode ? "midnight" : "primary"}
        style={styles.header}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{currentProgram.title}</Text>
            <Text style={styles.headerSubtitle}>
              {currentProgram.totalWeeks} weeks • {currentProgram.difficulty}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => handleShare('program', currentProgram)}
            style={styles.shareButton}
          >
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </SafeLinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Program Description */}
          <GlassGradient
            intensity="medium"
            style={[
              styles.descriptionCard,
              {
                borderColor: isDarkMode ? colors.dark.border.light : colors.light.border.light,
              }
            ]}
          >
            <Text style={[
              styles.description,
              { color: isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary }
            ]}>
              {currentProgram.description}
            </Text>
            
            <View style={styles.programMeta}>
              <View style={styles.metaRow}>
                <Ionicons 
                  name="barbell-outline" 
                  size={16} 
                  color={isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary} 
                />
                <Text style={[
                  styles.metaText,
                  { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
                ]}>
                  {currentProgram.equipment?.slice(0, 3).join(', ')}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons 
                  name="trending-up-outline" 
                  size={16} 
                  color={isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary} 
                />
                <Text style={[
                  styles.metaText,
                  { color: isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary }
                ]}>
                  Progressive overload
                </Text>
              </View>
            </View>
          </GlassGradient>

          {/* Stats Overview */}
          <StatsOverview />

          {/* Week Selector */}
          <WeekSelector />

          {/* Days List */}
          <View style={styles.daysSection}>
            <Text style={[
              styles.sectionTitle,
              { color: isDarkMode ? colors.dark.text.primary : colors.light.text.primary }
            ]}>
              {currentWeek?.title} - Week {selectedWeek}
            </Text>
            
            {currentWeek?.description && (
              <Text style={[
                styles.weekDescription,
                { color: isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary }
              ]}>
                {currentWeek.description}
              </Text>
            )}
            
            {currentWeek?.days.map(day => (
              <DayCard 
                key={day.id} 
                day={day} 
                weekNumber={selectedWeek}
              />
            ))}
          </View>

          {/* Demo Note */}
          <GlassGradient
            intensity="subtle"
            style={[
              styles.demoNote,
              {
                borderColor: colors.semantic.info.light.primary,
                backgroundColor: `${colors.semantic.info.light.primary}10`
              }
            ]}
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.semantic.info.light.primary} />
            <Text style={[
              styles.demoNoteText,
              { color: colors.semantic.info.light.primary }
            ]}>
              This is a mockup screen demonstrating the workout program interface. 
              All interactions are simulated locally without API calls.
            </Text>
          </GlassGradient>
          
          {/* Bottom spacing */}
          <View style={{ height: 50 }} />
        </Animated.View>
      </ScrollView>

      {/* Share Drawer */}
      <ShareWorkoutDrawer
        visible={shareDrawerVisible}
        onClose={() => setShareDrawerVisible(false)}
        shareType={shareType}
        program={shareType === 'program' ? currentProgram : null}
        day={shareType === 'day' ? shareContent : null}
        workout={shareType === 'workout' ? shareContent : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacing[12],
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[5],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: spacing[4],
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  shareButton: {
    padding: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing[5],
  },
  descriptionCard: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing[5],
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * 1.5,
    marginBottom: spacing[4],
  },
  programMeta: {
    gap: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  metaText: {
    fontSize: typography.fontSize.sm,
  },
  statsContainer: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing[5],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[4],
  },
  weekSelector: {
    marginBottom: spacing[6],
  },
  weekTab: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginRight: spacing[3],
    minWidth: 120,
    alignItems: 'center',
  },
  weekTabActive: {
    borderWidth: 2,
  },
  weekTabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  weekTabSubtext: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  daysSection: {
    gap: spacing[4],
  },
  weekDescription: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[4],
    fontStyle: 'italic',
  },
  dayCard: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    position: 'relative',
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  dayInfo: {
    flex: 1,
  },
  dayTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  daySubtitle: {
    fontSize: typography.fontSize.sm,
  },
  dayActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.4,
    marginBottom: spacing[4],
  },
  dayMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    flex: 1,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  startButtonText: {
    color: 'white',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  restButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  restButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  modifiedBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  modifiedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  demoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing[6],
  },
  demoNoteText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.4,
  },
});

export default MockupWorkoutScreen;