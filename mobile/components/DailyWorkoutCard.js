import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Dimensions,
  ActivityIndicator,
  Vibration,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import healthService from '../services/healthService';

const { width: screenWidth } = Dimensions.get('window');

export default function DailyWorkoutCard({ day, dayIndex, onComplete, onSchedule }) {
  const [expanded, setExpanded] = useState(false);
  const [exerciseStatus, setExerciseStatus] = useState({});
  const [isTracking, setIsTracking] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [totalVolume, setTotalVolume] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [notes, setNotes] = useState('');
  
  const expandAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerInterval = useRef(null);

  useEffect(() => {
    loadWorkoutStatus();
    
    // Pulse animation for active tracking
    if (isTracking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isTracking]);

  useEffect(() => {
    // Animate expansion
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      tension: 50,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  useEffect(() => {
    // Update progress animation
    const completedExercises = Object.keys(exerciseStatus).filter(
      key => exerciseStatus[key].completed
    ).length;
    const progress = day.workout ? completedExercises / day.workout.length : 0;
    
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [exerciseStatus]);

  const loadWorkoutStatus = async () => {
    try {
      const key = `workout_${dayIndex}_status`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setExerciseStatus(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading workout status:', error);
    }
  };

  const saveWorkoutStatus = async (status) => {
    try {
      const key = `workout_${dayIndex}_status`;
      await AsyncStorage.setItem(key, JSON.stringify(status));
    } catch (error) {
      console.error('Error saving workout status:', error);
    }
  };

  const startWorkout = () => {
    Alert.alert(
      'Start Workout',
      `Ready to begin ${day.title || `Day ${dayIndex + 1}`}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            setIsTracking(true);
            setWorkoutStartTime(Date.now());
            setCurrentExercise(0);
            setCurrentSet(1);
            startTimer();
            Vibration.vibrate(100);
          }
        }
      ]
    );
  };

  const startTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    
    timerInterval.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completeSet = () => {
    const exercise = day.workout[currentExercise];
    const exerciseKey = `exercise_${currentExercise}`;
    
    // Update exercise status
    const newStatus = {
      ...exerciseStatus,
      [exerciseKey]: {
        ...exerciseStatus[exerciseKey],
        setsCompleted: (exerciseStatus[exerciseKey]?.setsCompleted || 0) + 1,
        lastWeight: exerciseStatus[exerciseKey]?.lastWeight || 0,
        lastReps: exerciseStatus[exerciseKey]?.lastReps || exercise.reps,
      }
    };
    
    // Check if exercise is complete
    if (newStatus[exerciseKey].setsCompleted >= (exercise.sets || 3)) {
      newStatus[exerciseKey].completed = true;
      
      // Move to next exercise
      if (currentExercise < day.workout.length - 1) {
        setCurrentExercise(currentExercise + 1);
        setCurrentSet(1);
        startRestPeriod(90); // 90 second rest between exercises
      } else {
        // Workout complete
        completeWorkout();
      }
    } else {
      // Move to next set
      setCurrentSet(currentSet + 1);
      startRestPeriod(60); // 60 second rest between sets
    }
    
    setExerciseStatus(newStatus);
    saveWorkoutStatus(newStatus);
    
    // Update volume
    const weight = newStatus[exerciseKey].lastWeight || 0;
    const reps = parseInt(newStatus[exerciseKey].lastReps) || 10;
    setTotalVolume(prev => prev + (weight * reps));
    
    // Estimate calories (rough calculation)
    setCaloriesBurned(prev => prev + 5);
    
    Vibration.vibrate([0, 50, 100, 50]);
  };

  const startRestPeriod = (seconds) => {
    setIsResting(true);
    let restTime = seconds;
    
    const restInterval = setInterval(() => {
      restTime--;
      if (restTime <= 0) {
        clearInterval(restInterval);
        setIsResting(false);
        Vibration.vibrate(200);
      } else if (restTime <= 3) {
        Vibration.vibrate(50);
      }
    }, 1000);
  };

  const completeWorkout = () => {
    stopTimer();
    setIsTracking(false);
    
    const duration = Math.floor((Date.now() - workoutStartTime) / 1000 / 60); // minutes
    
    const workoutData = {
      id: `workout_${Date.now()}`,
      name: day.title || `Day ${dayIndex + 1} Workout`,
      completedAt: new Date().toISOString(),
      duration: duration,
      exercises: day.workout.length,
      totalVolume: totalVolume,
      calories: caloriesBurned,
      notes: notes,
      exerciseDetails: exerciseStatus,
    };
    
    // Sync with health service
    if (healthService.isInitialized) {
      healthService.syncWorkout(workoutData);
    }
    
    // Call parent completion handler
    if (onComplete) {
      onComplete(workoutData);
    }
    
    // Show completion animation
    Alert.alert(
      '🎉 Workout Complete!',
      `Great job! You completed ${day.workout.length} exercises in ${duration} minutes.\n\nTotal Volume: ${totalVolume} ${totalVolume === 1 ? 'lb' : 'lbs'}\nCalories Burned: ~${caloriesBurned}`,
      [{ text: 'Awesome!', style: 'default' }]
    );
    
    Vibration.vibrate([0, 100, 100, 100, 100, 100]);
  };

  const skipExercise = () => {
    Alert.alert(
      'Skip Exercise',
      'Are you sure you want to skip this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            if (currentExercise < day.workout.length - 1) {
              setCurrentExercise(currentExercise + 1);
              setCurrentSet(1);
            } else {
              completeWorkout();
            }
          }
        }
      ]
    );
  };

  const renderExercise = (exercise, index) => {
    const exerciseKey = `exercise_${index}`;
    const status = exerciseStatus[exerciseKey] || {};
    const isActive = isTracking && currentExercise === index;
    const isCompleted = status.completed;
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.exerciseItem,
          isActive && styles.activeExercise,
          isCompleted && styles.completedExercise,
          isActive && { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseInfo}>
            <Text style={[styles.exerciseName, isCompleted && styles.completedText]}>
              {exercise.exercise}
            </Text>
            <Text style={styles.exerciseDetails}>
              {exercise.sets || 3} sets × {exercise.reps} reps
              {exercise.rpe && ` @ RPE ${exercise.rpe}`}
              {exercise.weight && ` - ${exercise.weight}`}
            </Text>
          </View>
          
          <View style={styles.exerciseStatus}>
            {isCompleted && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
            {isActive && !isCompleted && (
              <View style={styles.activeIndicator}>
                <Text style={styles.setCounter}>
                  Set {currentSet}/{exercise.sets || 3}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {exercise.notes && (
          <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
        )}
        
        {isActive && !isResting && (
          <View style={styles.exerciseActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={completeSet}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>Complete Set</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={skipExercise}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {isActive && isResting && (
          <View style={styles.restingContainer}>
            <ActivityIndicator color="#FFB86B" />
            <Text style={styles.restingText}>Rest Period - Get ready for next set!</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderNutrition = () => {
    if (!day.mealPlan) return null;
    
    return (
      <View style={styles.nutritionSection}>
        <Text style={styles.sectionTitle}>Nutrition Plan</Text>
        
        {day.mealPlan.breakfast && (
          <View style={styles.mealItem}>
            <Ionicons name="sunny" size={20} color="#FFB86B" />
            <View style={styles.mealInfo}>
              <Text style={styles.mealTitle}>Breakfast</Text>
              <Text style={styles.mealDescription}>{day.mealPlan.breakfast}</Text>
            </View>
          </View>
        )}
        
        {day.mealPlan.lunch && (
          <View style={styles.mealItem}>
            <Ionicons name="partly-sunny" size={20} color="#FFB86B" />
            <View style={styles.mealInfo}>
              <Text style={styles.mealTitle}>Lunch</Text>
              <Text style={styles.mealDescription}>{day.mealPlan.lunch}</Text>
            </View>
          </View>
        )}
        
        {day.mealPlan.dinner && (
          <View style={styles.mealItem}>
            <Ionicons name="moon" size={20} color="#FFB86B" />
            <View style={styles.mealInfo}>
              <Text style={styles.mealTitle}>Dinner</Text>
              <Text style={styles.mealDescription}>{day.mealPlan.dinner}</Text>
            </View>
          </View>
        )}
        
        {day.mealPlan.snacks && (
          <View style={styles.mealItem}>
            <Ionicons name="nutrition" size={20} color="#FFB86B" />
            <View style={styles.mealInfo}>
              <Text style={styles.mealTitle}>Snacks</Text>
              <Text style={styles.mealDescription}>{day.mealPlan.snacks}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const completedExercises = Object.keys(exerciseStatus).filter(
    key => exerciseStatus[key].completed
  ).length;
  const totalExercises = day.workout?.length || 0;
  const progressPercentage = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1B1E', '#0A0B0D']}
        style={styles.card}
      >
        {/* Card Header */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.8}
        >
          <View style={styles.dayInfo}>
            <Text style={styles.dayLabel}>{day.day}</Text>
            <Text style={styles.dayTitle}>{day.title}</Text>
            {day.focus && (
              <Text style={styles.dayFocus}>Focus: {day.focus}</Text>
            )}
          </View>
          
          <View style={styles.headerRight}>
            {isTracking && (
              <View style={styles.timerContainer}>
                <Ionicons name="time" size={16} color="#FFB86B" />
                <Text style={styles.timerText}>{formatTimer(timer)}</Text>
              </View>
            )}
            
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#FFB86B"
            />
          </View>
        </TouchableOpacity>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={['#FFB86B', '#FF7E87']}
              style={styles.progressGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
          <Text style={styles.progressText}>
            {completedExercises}/{totalExercises} Exercises
          </Text>
        </View>
        
        {/* Expanded Content */}
        <Animated.View
          style={[
            styles.expandedContent,
            {
              maxHeight: expandAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1000],
              }),
              opacity: expandAnim,
            },
          ]}
        >
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!isTracking ? (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={startWorkout}
                >
                  <LinearGradient
                    colors={['#FFB86B', '#FF7E87']}
                    style={styles.primaryButtonGradient}
                  >
                    <Ionicons name="play" size={20} color="#FFF" />
                    <Text style={styles.primaryButtonText}>Start Workout</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onSchedule}
                >
                  <Ionicons name="calendar" size={20} color="#FFB86B" />
                  <Text style={styles.secondaryButtonText}>Schedule</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={() => {
                  Alert.alert(
                    'End Workout',
                    'Are you sure you want to end this workout?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'End Workout',
                        style: 'destructive',
                        onPress: completeWorkout,
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="stop" size={20} color="#FF7E87" />
                <Text style={styles.stopButtonText}>End Workout</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Workout Section */}
          <View style={styles.workoutSection}>
            <Text style={styles.sectionTitle}>Workout</Text>
            <ScrollView
              style={styles.exerciseList}
              showsVerticalScrollIndicator={false}
            >
              {day.workout?.map((exercise, index) => renderExercise(exercise, index))}
            </ScrollView>
          </View>
          
          {/* Nutrition Section */}
          {renderNutrition()}
          
          {/* Notes Section */}
          {day.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{day.notes}</Text>
            </View>
          )}
          
          {/* Stats Summary */}
          {isTracking && (
            <View style={styles.statsSection}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{formatTimer(timer)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Volume</Text>
                <Text style={styles.statValue}>{totalVolume} lbs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Calories</Text>
                <Text style={styles.statValue}>~{caloriesBurned}</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: screenWidth - 30,
    marginVertical: 10,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    // Use boxShadow for web, keep elevation for Android
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  dayInfo: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    color: '#FFB86B',
    fontWeight: '600',
    marginBottom: 4,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8F9FA',
    marginBottom: 4,
  },
  dayFocus: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2B2E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  timerText: {
    color: '#FFB86B',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    height: 30,
    backgroundColor: '#2A2B2E',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  progressText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -10 }],
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    overflow: 'hidden',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    height: 44,
  },
  primaryButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB86B',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#FFB86B',
    fontSize: 15,
    fontWeight: '600',
  },
  stopButton: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#2A2B2E',
    gap: 8,
  },
  stopButtonText: {
    color: '#FF7E87',
    fontSize: 15,
    fontWeight: '600',
  },
  workoutSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8F9FA',
    marginBottom: 12,
  },
  exerciseList: {
    maxHeight: 400,
  },
  exerciseItem: {
    backgroundColor: '#2A2B2E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3A3B3E',
  },
  activeExercise: {
    borderColor: '#FFB86B',
    borderWidth: 2,
  },
  completedExercise: {
    opacity: 0.7,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8F9FA',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  exerciseDetails: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  exerciseStatus: {
    alignItems: 'center',
  },
  activeIndicator: {
    backgroundColor: '#FFB86B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  setCounter: {
    color: '#0A0B0D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  exerciseNotes: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    height: 36,
  },
  actionButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#3A3B3E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  restingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#3A3B3E',
    borderRadius: 8,
  },
  restingText: {
    color: '#FFB86B',
    fontSize: 14,
  },
  nutritionSection: {
    marginBottom: 20,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2A2B2E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8F9FA',
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    backgroundColor: '#2A2B2E',
    padding: 12,
    borderRadius: 10,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2A2B2E',
    borderRadius: 12,
    padding: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFB86B',
  },
});