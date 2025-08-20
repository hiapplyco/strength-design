import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient } from '../components/SafeLinearGradient';
import { useTheme, themedStyles } from '../contexts/ThemeContext';
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
import contextAggregator from '../services/contextAggregator';
import sessionContextManager from '../services/sessionContextManager';

export default function WorkoutsScreen({ navigation }) {
  const [dailyWorkouts, setDailyWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedExercises, setEditedExercises] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [contextModalVisible, setContextModalVisible] = useState(false);
  
  const theme = useTheme();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Subscribe to daily workouts - simplified query to avoid index requirement
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
        
        // Sort client-side to avoid index requirement
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
        // Still handle gracefully but workouts should load now
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

  const openEditModal = (workout) => {
    setEditingWorkout(workout);
    setEditedExercises(workout.exercises || []);
    setEditModalVisible(true);
  };

  const saveEditedWorkout = async () => {
    if (!editingWorkout) return;

    try {
      await updateDoc(doc(db, 'dailyWorkouts', editingWorkout.id), {
        exercises: editedExercises,
        modifiedAt: new Date(),
      });
      setEditModalVisible(false);
      Alert.alert('Success', 'Workout updated successfully!');
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const deleteWorkout = async (workoutId) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'dailyWorkouts', workoutId));
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout');
            }
          }
        }
      ]
    );
  };

  const updateExercise = (exerciseIndex, field, value) => {
    const updated = [...editedExercises];
    updated[exerciseIndex] = {
      ...updated[exerciseIndex],
      [field]: value
    };
    setEditedExercises(updated);
  };

  const addExercise = () => {
    setEditedExercises([
      ...editedExercises,
      { name: 'New Exercise', sets: 3, reps: '10', weight: '0' }
    ]);
  };

  const removeExercise = (index) => {
    setEditedExercises(editedExercises.filter((_, i) => i !== index));
  };

  const handleProgramSelect = async (program) => {
    try {
      // Initialize session manager and track screen visit
      await sessionContextManager.initialize();
      await sessionContextManager.trackScreenVisit('Workouts');
      
      // Add program to session context
      await sessionContextManager.addProgram(program, 'workouts');
      
      // Store the program context for backward compatibility
      await contextAggregator.storeProgramContext(program);
      
      // Get comprehensive session context for AI
      const aiContext = await sessionContextManager.getAIChatContext();
      
      console.log('🏋️ Program selected, navigating with session context');
      
      // Navigate to context-aware workout generator with the selected program as context
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
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.dayLabel}>Day {workout.dayNumber}</Text>
              <Text style={styles.dateLabel}>{formatDate(workout.scheduledDate)}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => openEditModal(workout)}
              >
                <Ionicons name="pencil" size={18} color="#FFF" />
              </TouchableOpacity>
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
          </View>

          {/* Workout Name */}
          <Text style={styles.workoutName}>{workout.dayName || 'Workout'}</Text>

          {/* Exercise List Preview */}
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

          {/* Progress Bar */}
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

  const renderEditModal = () => (
    <Modal
      visible={editModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Workout</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {editedExercises.map((exercise, index) => (
              <View key={index} style={styles.editExerciseItem}>
                <View style={styles.exerciseHeader}>
                  <TextInput
                    style={styles.exerciseNameInput}
                    value={exercise.name}
                    onChangeText={(text) => updateExercise(index, 'name', text)}
                    placeholder="Exercise name"
                    placeholderTextColor="#666"
                  />
                  <TouchableOpacity 
                    onPress={() => removeExercise(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF4444" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.exerciseDetailsRow}>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Sets</Text>
                    <TextInput
                      style={styles.detailValue}
                      value={String(exercise.sets)}
                      onChangeText={(text) => updateExercise(index, 'sets', text)}
                      keyboardType="numeric"
                      placeholderTextColor="#666"
                    />
                  </View>
                  
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Reps</Text>
                    <TextInput
                      style={styles.detailValue}
                      value={String(exercise.reps)}
                      onChangeText={(text) => updateExercise(index, 'reps', text)}
                      placeholderTextColor="#666"
                    />
                  </View>
                  
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Weight</Text>
                    <TextInput
                      style={styles.detailValue}
                      value={String(exercise.weight || '0')}
                      onChangeText={(text) => updateExercise(index, 'weight', text)}
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addExerciseButton} onPress={addExercise}>
              <Ionicons name="add-circle-outline" size={24} color="#FFB86B" />
              <Text style={styles.addExerciseText}>Add Exercise</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={saveEditedWorkout}
            >
              <SafeLinearGradient
                colors={['#FF7E87', '#FFB86B']}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </SafeLinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeLinearGradient
          colors={theme.isDarkMode ? ['#0A0A0C', '#1A1A1C'] : ['#F5F5F7', '#E8E8ED']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.theme.primary} />
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
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.theme.textOnGlass }]}>My Workouts</Text>
          <Text style={[styles.headerSubtitle, { color: theme.theme.textSecondary }]}>Track and manage your workout plans</Text>
          
          {/* Perplexity Status Badge */}
          <View style={styles.apiStatusContainer}>
            <View style={styles.apiStatusBadge}>
              <View style={styles.apiStatusDot} />
              <Text style={styles.apiStatusText}>Perplexity AI Active</Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setSearchModalVisible(true)}
              style={styles.actionButton}
            >
              <GlassCard variant="subtle" style={styles.actionCard}>
                <Ionicons name="search" size={20} color="#20B5AC" />
                <Text style={[styles.actionButtonText, { color: theme.theme.textOnGlass }]}>Find Programs</Text>
              </GlassCard>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('MockupWorkout')}
              style={styles.actionButton}
            >
              <GlassCard variant="subtle" style={styles.actionCard}>
                <Ionicons name="flask" size={20} color={theme.theme.warning || '#FFA500'} />
                <Text style={[styles.actionButtonText, { color: theme.theme.textOnGlass }]}>Demo Mode</Text>
              </GlassCard>
            </TouchableOpacity>
          </View>
          
          {/* Primary Generate Button */}
          <TouchableOpacity 
            onPress={() => setContextModalVisible(true)}
            style={styles.primaryButton}
          >
            <SafeLinearGradient
              colors={['#FFB86B', '#FF7E87']}
              style={styles.primaryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add-circle" size={24} color="#FFF" />
              <Text style={styles.primaryButtonText}>Generate New Workout</Text>
            </SafeLinearGradient>
          </TouchableOpacity>
        </View>

        {/* Workouts List */}
        <View style={styles.workoutsContainer}>
          {dailyWorkouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={80} color={theme.theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.theme.textOnGlass }]}>No Workouts Yet</Text>
              <Text style={[styles.emptyText, { color: theme.theme.textSecondary }]}>
                Generate your first personalized workout plan!
              </Text>
              <TouchableOpacity 
                onPress={() => setContextModalVisible(true)}
                style={styles.emptyStateButton}
              >
                <SafeLinearGradient
                  colors={['#FFB86B', '#FF7E87']}
                  style={styles.emptyStateButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.ctaButtonText}>Get Started</Text>
                </SafeLinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {dailyWorkouts.map(renderWorkoutCard)}
            </View>
          )}
        </View>

      </ScrollView>
      
      {renderEditModal()}
      
      {/* Program Search Modal */}
      <ProgramSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onProgramSelect={handleProgramSelect}
        navigation={navigation}
      />
      
      {/* Context Modal - Shows when generating without context */}
      <ContextModal
        visible={contextModalVisible}
        onClose={() => setContextModalVisible(false)}
        onNavigate={(screen) => {
          setContextModalVisible(false);
          if (screen === 'Generator') {
            // Special case: if they skip, check for ContextAwareGenerator
            const contextAwareScreen = navigation.getState().routes.find(
              route => route.name === 'ContextAwareGenerator'
            );
            navigation.navigate(contextAwareScreen ? 'ContextAwareGenerator' : 'WorkoutGenerator');
          } else {
            navigation.navigate(screen);
          }
        }}
        title="Personalize Your Workouts"
        subtitle="Get AI-powered workouts tailored to your fitness level and goals"
      />
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
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  apiStatusContainer: {
    marginBottom: 24,
  },
  apiStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(32, 181, 172, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(32, 181, 172, 0.3)',
  },
  apiStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#20B5AC',
    marginRight: 6,
  },
  apiStatusText: {
    fontSize: 12,
    color: '#20B5AC',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    maxWidth: 180,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: Platform.select({
      web: '0px 4px 8px rgba(255, 126, 135, 0.3)',
      default: undefined,
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#FF7E87',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  workoutsList: {
    flex: 1,
  },
  cardsContainer: {
    padding: 16,
  },
  workoutCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  completedCard: {
    opacity: 0.8,
  },
  cardGradient: {
    padding: 20,
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
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  emptyStateButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyStateButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  editExerciseItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#0A0A0C',
    borderRadius: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNameInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
  },
  removeButton: {
    marginLeft: 12,
    padding: 4,
  },
  exerciseDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 8,
    color: '#FFF',
    textAlign: 'center',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 107, 0.3)',
    borderStyle: 'dashed',
  },
  addExerciseText: {
    color: '#FFB86B',
    fontSize: 16,
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    padding: 14,
    backgroundColor: '#2C2C3E',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
  },
  saveButtonGradient: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});