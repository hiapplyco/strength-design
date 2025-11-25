import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient } from '../components/SafeLinearGradient';
import { useTheme, themedStyles } from '../contexts/ThemeContext';
import GlobalContextStatusLine from '../components/GlobalContextStatusLine';
import { GlassCard } from '../components/GlassmorphismComponents';
import { auth, db } from '../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc 
} from 'firebase/firestore';
import ProgramSearchModal from '../components/ProgramSearchModal';
import ContextModal from '../components/ContextModal';
import GlobalContextButton from '../components/GlobalContextButton';
import contextAggregator from '../services/contextAggregator';
import sessionContextManager from '../services/sessionContextManager';

const { width: screenWidth } = Dimensions.get('window');

export default function WorkoutsScreen({ navigation }) {
  const [dailyWorkouts, setDailyWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedExercises, setEditedExercises] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [contextModalVisible, setContextModalVisible] = useState(false);

  const theme = useTheme();

  // Defensive: ensure colors are available
  const colors = theme?.colors || {
    primary: '#FF6B35',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textOnGlass: '#FFFFFF',
    surface: '#1C1C1E',
  };
  const neonAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Neon pulsing animation for title
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

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Subscribe to daily workouts
    const q = query(
      collection(db, 'dailyWorkouts'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const workouts = [];
        snapshot.forEach((doc) => {
          workouts.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort client-side
        workouts.sort((a, b) => {
          const dateA = a.scheduledDate?.toDate ? a.scheduledDate.toDate() : new Date(a.scheduledDate || 0);
          const dateB = b.scheduledDate?.toDate ? b.scheduledDate.toDate() : new Date(b.scheduledDate || 0);
          return dateA - dateB;
        });
        
        setDailyWorkouts(workouts);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching workouts:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatDate = (date) => {
    if (!date) return 'Today';
    const workoutDate = date.toDate ? date.toDate() : new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (workoutDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (workoutDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return workoutDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const toggleWorkoutComplete = async (workout) => {
    try {
      await updateDoc(doc(db, 'dailyWorkouts', workout.id), {
        completed: !workout.completed,
        completedAt: !workout.completed ? new Date() : null,
      });
    } catch (error) {
      console.error('Error updating workout:', error);
      Alert.alert('Error', 'Failed to update workout status');
    }
  };

  const handleProgramSelect = async (program) => {
    try {
      await sessionContextManager.initialize();
      await sessionContextManager.trackScreenVisit('Workouts');
      await sessionContextManager.addProgram(program, 'workouts');
      await contextAggregator.storeProgramContext(program);
      
      const aiContext = await sessionContextManager.getAIChatContext();
      
      console.log('🏋️ Program selected, navigating with session context');
      
      navigation.navigate('ContextAwareGenerator', { 
        selectedProgram: program,
        sessionContext: aiContext.fullContext,
        programContext: {
          name: program.name,
          creator: program.creator,
          methodology: program.methodology,
          structure: program.structure,
          goals: program.goals,
          experienceLevel: program.experienceLevel,
          duration: program.duration,
          credibilityScore: program.credibilityScore,
          exercises: program.exercises || [],
          principles: program.principles || [],
          equipment: program.equipment || []
        }
      });
    } catch (error) {
      console.error('Error handling program selection:', error);
      Alert.alert('Error', 'Failed to select program. Please try again.');
    }
  };

  const renderWorkoutCard = (workout) => {
    const isToday = formatDate(workout.scheduledDate) === 'Today';
    const progress = workout.completed ? 100 : 0;

    return (
      <TouchableOpacity
        key={workout.id}
        style={{ marginBottom: 16, opacity: workout.completed ? 0.8 : 1 }}
        onPress={() => navigation.navigate('WorkoutDetail', { workout })}
        activeOpacity={0.8}
      >
        <GlassCard variant="medium" style={{ padding: 0, overflow: 'hidden' }}>
          <SafeLinearGradient
            colors={workout.completed 
              ? ['#4CAF50', '#45B049']
              : isToday 
                ? ['#FFB86B', '#FF7E87']
                : theme.isDarkMode
                  ? ['rgba(44, 44, 62, 0.8)', 'rgba(28, 28, 30, 0.8)']
                  : ['rgba(248, 249, 250, 0.8)', 'rgba(241, 243, 244, 0.8)']
            }
            style={{ padding: 20 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.dayLabel}>Day {workout.dayNumber}</Text>
              <Text style={styles.dateLabel}>{formatDate(workout.scheduledDate)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => toggleWorkoutComplete(workout)}
            >
              <Ionicons 
                name={workout.completed ? "checkmark-circle" : "checkmark-circle-outline"} 
                size={24} 
                color="#FFF" 
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.workoutName}>{workout.dayName || 'Workout'}</Text>

          <View style={styles.exerciseList}>
            {(workout.exercises || []).slice(0, 3).map((exercise, index) => (
              <View key={index} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>• {exercise.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.sets} × {exercise.reps}
                </Text>
              </View>
            ))}
            {workout.exercises && workout.exercises.length > 3 && (
              <Text style={styles.moreExercises}>
                +{workout.exercises.length - 3} more exercises
              </Text>
            )}
          </View>

          {isToday && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${progress}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {workout.completed ? 'Completed!' : 'Ready to start'}
              </Text>
            </View>
          )}
          </SafeLinearGradient>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeLinearGradient
          colors={theme.isDarkMode ? ['#0A0A0C', '#1A1A1C'] : ['#F5F5F7', '#E8E8ED']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme?.colors?.primary || '#FF6B35'} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeLinearGradient
        colors={theme.isDarkMode ? ['#0A0A0C', '#1A1A1C'] : ['#F5F5F7', '#E8E8ED']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Global Context Status Line */}
      <GlobalContextStatusLine navigation={navigation} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Neon Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Animated.Text style={[
              styles.headerTitle,
              {
                color: neonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#00F0FF', '#FFD700'],
                }),
                textShadowColor: neonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#00F0FF', '#FFD700'],
                }),
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: neonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 35], // Increased blur
                }),
              }
            ]}>
              PROGRAMS
            </Animated.Text>
            {/* Removed outline - keeping just glow */}
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Search for highly technical workout programs and get AI-tailored workouts
          </Text>
          
          <Text style={styles.explanationText}>
            Find specialized programs like 5/3/1 variations, nSuns, GZCL methods, or powerlifting protocols. Our AI will adapt them to your experience level, equipment, and goals.
          </Text>
          
          {/* Primary Search Focus */}
          <TouchableOpacity 
            onPress={() => setSearchModalVisible(true)}
            style={styles.primarySearchButton}
          >
            <SafeLinearGradient
              colors={['#00F0FF', '#00FF88']}
              style={styles.primarySearchGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="search" size={24} color="#000" />
              <Text style={styles.primarySearchText}>Search Technical Programs</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </SafeLinearGradient>
          </TouchableOpacity>

          <Text style={styles.searchHint}>
            StrongLifts 5x5 • Wendler 5/3/1 • nSuns • GZCL • Smolov • Mag/Ort • Any technical program!
          </Text>
        </View>

        {/* Workouts List */}
        <View style={styles.workoutsContainer}>
          {dailyWorkouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={80} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textOnGlass }]}>
                Ready to Start?
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Search for technical programs and we'll create personalized workouts based on your context
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Your Active Workouts</Text>
              {dailyWorkouts.map(renderWorkoutCard)}
            </View>
          )}
        </View>

      </ScrollView>
      
      {/* Program Search Modal */}
      <ProgramSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onProgramSelect={handleProgramSelect}
        navigation={navigation}
      />
      
      {/* Context Modal */}
      <ContextModal
        visible={contextModalVisible}
        onClose={() => setContextModalVisible(false)}
        onNavigate={(screen) => {
          setContextModalVisible(false);
          navigation.navigate(screen === 'Generator' ? 'WorkoutGenerator' : screen);
        }}
        title="Personalize Your Workouts"
        subtitle="Get AI-powered workouts tailored to your fitness level and goals"
      />
      
      {/* Global Context Button */}
      <GlobalContextButton navigation={navigation} position="top-right" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  workoutsContainer: {
    padding: 16,
    paddingBottom: 40,
    minHeight: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  titleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif-black',
      default: 'System',
    }),
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  primarySearchButton: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  primarySearchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 10,
  },
  primarySearchText: {
    color: '#000',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  searchHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    paddingHorizontal: 30,
  },
  explanationText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 255, 0.3)',
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#FF00FF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
    marginLeft: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.8,
  },
  dateLabel: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
    marginTop: 2,
  },
  actionButton: {
    padding: 8,
  },
  workoutName: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  exerciseList: {
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
  exerciseDetails: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.7,
  },
  moreExercises: {
    color: '#FFF',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  progressText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});