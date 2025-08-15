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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function WorkoutsScreen({ navigation }) {
  const [dailyWorkouts, setDailyWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedExercises, setEditedExercises] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Subscribe to daily workouts
    const q = query(
      collection(db, 'dailyWorkouts'),
      where('userId', '==', user.uid),
      orderBy('scheduledDate', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workouts = [];
      snapshot.forEach((doc) => {
        workouts.push({ id: doc.id, ...doc.data() });
      });
      setDailyWorkouts(workouts);
      setLoading(false);
    });

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

  const renderWorkoutCard = (workout) => {
    const isToday = formatDate(workout.scheduledDate) === 'Today';
    const progress = workout.completed ? 100 : 0;

    return (
      <TouchableOpacity
        key={workout.id}
        style={[styles.workoutCard, workout.completed && styles.completedCard]}
        onPress={() => navigation.navigate('WorkoutDetail', { workout })}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={workout.completed 
            ? ['#4CAF50', '#45B049'] 
            : isToday 
              ? ['#FF7E87', '#FFB86B']
              : ['#2C2C3E', '#1C1C1E']
          }
          style={styles.cardGradient}
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
        </LinearGradient>
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
              <LinearGradient
                colors={['#FF7E87', '#FFB86B']}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB86B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1A1A1E', '#2C2C3E']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>My Workouts</Text>
        <TouchableOpacity 
          style={styles.generateButton}
          onPress={() => navigation.navigate('WorkoutGenerator')}
        >
          <LinearGradient
            colors={['#FF7E87', '#FFB86B']}
            style={styles.generateButtonGradient}
          >
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.generateButtonText}>Generate New</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Workouts List */}
      <ScrollView style={styles.workoutsList}>
        {dailyWorkouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={80} color="#666" />
            <Text style={styles.emptyTitle}>No Workouts Yet</Text>
            <Text style={styles.emptyText}>
              Generate your first personalized workout plan!
            </Text>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => navigation.navigate('WorkoutGenerator')}
            >
              <LinearGradient
                colors={['#FF7E87', '#FFB86B']}
                style={styles.ctaButtonGradient}
              >
                <Text style={styles.ctaButtonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {dailyWorkouts.map(renderWorkoutCard)}
          </View>
        )}
      </ScrollView>

      {renderEditModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0C',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  generateButton: {
    borderRadius: 20,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
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
  },
  ctaButton: {
    marginTop: 24,
    borderRadius: 25,
  },
  ctaButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
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