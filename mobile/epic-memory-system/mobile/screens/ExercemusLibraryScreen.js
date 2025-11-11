import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, functions } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const { width: screenWidth } = Dimensions.get('window');

export default function ExercemusLibraryScreen({ navigation }) {
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [equipment, setEquipment] = useState(['all']);
  const [muscles, setMuscles] = useState(['all']);
  const [savedExercises, setSavedExercises] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Fetch exercises using the new Firebase Function
  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const searchExercemus = httpsCallable(functions, 'searchExercemusExercises');
      const result = await searchExercemus({
        query: searchQuery.trim(),
        category: selectedCategory !== 'all' ? selectedCategory : '',
        equipment: selectedEquipment !== 'all' ? selectedEquipment : '',
        muscle: selectedMuscle !== 'all' ? selectedMuscle : '',
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : '',
        limit: 100
      });
      
      const data = result.data;
      setExercises(data.exercises || []);
      
      console.log(`✅ Fetched ${data.exercises?.length || 0} exercises from exercemus`);
      
    } catch (error) {
      console.error('Error fetching exercises:', error);
      
      // Fallback to direct Firestore query
      try {
        console.log('🔄 Falling back to direct Firestore query...');
        const exercisesRef = collection(db, 'exercemus_exercises');
        const snapshot = await getDocs(exercisesRef);
        
        const exercisesList = [];
        snapshot.forEach(doc => {
          exercisesList.push({
            ...doc.data(),
            id: doc.id
          });
        });
        
        // Apply basic filtering
        let filtered = exercisesList;
        if (searchQuery) {
          const searchTerm = searchQuery.toLowerCase();
          filtered = exercisesList.filter(ex => 
            ex.name?.toLowerCase().includes(searchTerm) ||
            ex.description?.toLowerCase().includes(searchTerm)
          );
        }
        
        setExercises(filtered.slice(0, 100));
        console.log(`✅ Fallback: Fetched ${filtered.length} exercises`);
        
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        Alert.alert('Error', 'Failed to load exercises. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedEquipment, selectedMuscle, selectedDifficulty]);

  // Load metadata (categories, equipment, muscles)
  const loadMetadata = useCallback(async () => {
    try {
      // Load categories
      const categoriesRef = collection(db, 'exercise_categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      const categoriesList = ['all'];
      categoriesSnapshot.forEach(doc => {
        categoriesList.push(doc.data().name || doc.id);
      });
      setCategories(categoriesList);

      // Load equipment
      const equipmentRef = collection(db, 'exercise_equipment');
      const equipmentSnapshot = await getDocs(equipmentRef);
      const equipmentList = ['all'];
      equipmentSnapshot.forEach(doc => {
        equipmentList.push(doc.data().name || doc.id);
      });
      setEquipment(equipmentList);

      // Load muscles
      const musclesRef = collection(db, 'exercise_muscles');
      const musclesSnapshot = await getDocs(musclesRef);
      const musclesList = ['all'];
      musclesSnapshot.forEach(doc => {
        musclesList.push(doc.data().name || doc.id);
      });
      setMuscles(musclesList);

    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  }, []);

  // Load saved exercises
  const loadSavedExercises = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const savedRef = collection(db, 'users', user.uid, 'savedExercises');
      const snapshot = await getDocs(savedRef);
      
      const saved = [];
      snapshot.forEach(doc => {
        saved.push({
          ...doc.data(),
          id: doc.id
        });
      });
      
      setSavedExercises(saved);
    } catch (error) {
      console.error('Error loading saved exercises:', error);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
    loadSavedExercises();
  }, [loadMetadata, loadSavedExercises]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchExercises();
    }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [fetchExercises]);

  const toggleSaveExercise = async (exercise) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to save exercises.');
        return;
      }

      const savedRef = doc(db, 'users', user.uid, 'savedExercises', exercise.id);
      const isCurrentlySaved = savedExercises.some(e => e.id === exercise.id);

      if (isCurrentlySaved) {
        await deleteDoc(savedRef);
        setSavedExercises(prev => prev.filter(e => e.id !== exercise.id));
        Alert.alert('Removed', 'Exercise removed from favorites');
      } else {
        await setDoc(savedRef, {
          ...exercise,
          savedAt: new Date().toISOString()
        });
        setSavedExercises(prev => [...prev, exercise]);
        Alert.alert('Saved', 'Exercise added to favorites');
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
      Alert.alert('Error', 'Failed to save exercise');
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchExercises(),
      loadSavedExercises(),
      loadMetadata()
    ]).finally(() => setRefreshing(false));
  }, [fetchExercises, loadSavedExercises, loadMetadata]);

  const renderExerciseItem = ({ item }) => {
    const isSaved = savedExercises.some(e => e.id === item.id);
    
    return (
      <TouchableOpacity
        style={styles.exerciseCard}
        onPress={() => setSelectedExercise(item)}
      >
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.exerciseCategory}>
              {item.category?.charAt(0).toUpperCase() + item.category?.slice(1)}
            </Text>
            
            <View style={styles.exerciseTags}>
              {item.equipment?.slice(0, 2).map(eq => (
                <View key={eq} style={styles.tag}>
                  <Text style={styles.tagText}>{eq}</Text>
                </View>
              ))}
              {item.difficulty && (
                <View style={[styles.tag, styles.difficultyTag]}>
                  <Text style={styles.tagText}>{item.difficulty}</Text>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => toggleSaveExercise(item)}
            style={styles.saveButton}
          >
            <Ionicons
              name={isSaved ? "heart" : "heart-outline"}
              size={24}
              color={isSaved ? "#FF6B35" : "#666"}
            />
          </TouchableOpacity>
        </View>
        
        {item.primary_muscles && item.primary_muscles.length > 0 && (
          <View style={styles.muscleSection}>
            <Text style={styles.muscleLabel}>Primary:</Text>
            <Text style={styles.muscleText}>
              {item.primary_muscles.slice(0, 3).join(', ')}
              {item.primary_muscles.length > 3 && '...'}
            </Text>
          </View>
        )}
        
        {/* Show exercise image if available */}
        {item.images && item.images.length > 0 && (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.exerciseImage}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
    );
  };

  const ExerciseDetailModal = () => {
    if (!selectedExercise) return null;
    
    const isSaved = savedExercises.some(e => e.id === selectedExercise.id);
    
    return (
      <Modal
        visible={!!selectedExercise}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedExercise.name}</Text>
                <TouchableOpacity
                  onPress={() => setSelectedExercise(null)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {/* Exercise Image */}
              {selectedExercise.images && selectedExercise.images.length > 0 && (
                <Image
                  source={{ uri: selectedExercise.images[0] }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}
              
              <View style={styles.modalBody}>
                {selectedExercise.description && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailValue}>{selectedExercise.description}</Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>
                    {selectedExercise.category?.charAt(0).toUpperCase() + selectedExercise.category?.slice(1)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Equipment:</Text>
                  <Text style={styles.detailValue}>
                    {selectedExercise.equipment?.join(', ') || 'None'}
                  </Text>
                </View>
                
                {selectedExercise.difficulty && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Difficulty:</Text>
                    <Text style={styles.detailValue}>
                      {selectedExercise.difficulty.charAt(0).toUpperCase() + selectedExercise.difficulty.slice(1)}
                    </Text>
                  </View>
                )}
                
                {selectedExercise.primary_muscles && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Primary Muscles:</Text>
                    <Text style={styles.detailValue}>
                      {selectedExercise.primary_muscles.map(m => 
                        m.charAt(0).toUpperCase() + m.slice(1)
                      ).join(', ')}
                    </Text>
                  </View>
                )}
                
                {selectedExercise.secondary_muscles && selectedExercise.secondary_muscles.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Secondary Muscles:</Text>
                    <Text style={styles.detailValue}>
                      {selectedExercise.secondary_muscles.map(m => 
                        m.charAt(0).toUpperCase() + m.slice(1)
                      ).join(', ')}
                    </Text>
                  </View>
                )}
                
                {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Instructions:</Text>
                    {selectedExercise.instructions.map((instruction, index) => (
                      <Text key={index} style={styles.instructionText}>
                        {index + 1}. {instruction}
                      </Text>
                    ))}
                  </View>
                )}
                
                {/* Attribution */}
                <View style={styles.attributionSection}>
                  <Text style={styles.attributionText}>
                    Data from {selectedExercise.source || 'exercemus'} open-source database
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, isSaved && styles.savedButton]}
                onPress={() => toggleSaveExercise(selectedExercise)}
              >
                <Ionicons
                  name={isSaved ? "heart" : "heart-outline"}
                  size={20}
                  color={isSaved ? "#fff" : "#FF6B35"}
                />
                <Text style={[styles.actionButtonText, isSaved && styles.savedButtonText]}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setSelectedExercise(null);
                  navigation.navigate('Generator', { 
                    suggestedExercise: selectedExercise 
                  });
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FF6B35" />
                <Text style={styles.actionButtonText}>Add to Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        style={styles.header}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise Database</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterButton}
          >
            <Ionicons name="filter" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowSavedOnly(!showSavedOnly)}
            style={[styles.filterButton, showSavedOnly && styles.activeFilter]}
          >
            <Ionicons name="heart" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search 872+ exercises..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <Text style={styles.filterLabel}>Category:</Text>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  selectedCategory === category && styles.filterChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedCategory === category && styles.filterChipTextActive
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <Text style={styles.filterLabel}>Equipment:</Text>
            {equipment.slice(0, 8).map(eq => (
              <TouchableOpacity
                key={eq}
                style={[
                  styles.filterChip,
                  selectedEquipment === eq && styles.filterChipActive
                ]}
                onPress={() => setSelectedEquipment(eq)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedEquipment === eq && styles.filterChipTextActive
                ]}>
                  {eq.charAt(0).toUpperCase() + eq.slice(1).replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <Text style={styles.filterLabel}>Difficulty:</Text>
            {['all', 'beginner', 'intermediate', 'advanced'].map(diff => (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.filterChip,
                  selectedDifficulty === diff && styles.filterChipActive
                ]}
                onPress={() => setSelectedDifficulty(diff)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedDifficulty === diff && styles.filterChipTextActive
                ]}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      ) : (
        <FlatList
          data={showSavedOnly ? savedExercises : exercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.exerciseList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6B35"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="barbell-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>
                {showSavedOnly ? 'No saved exercises yet' : 'No exercises found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {showSavedOnly ? 'Save exercises to see them here' : 'Try a different search or check filters'}
              </Text>
            </View>
          }
        />
      )}

      <ExerciseDetailModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    padding: 5,
  },
  activeFilter: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: 'white',
    fontSize: 14,
  },
  filtersContainer: {
    paddingVertical: 10,
  },
  filterRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterLabel: {
    color: '#888',
    fontSize: 12,
    marginRight: 10,
    alignSelf: 'center',
    minWidth: 60,
  },
  filterChip: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  filterChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterChipText: {
    color: '#999',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: 'white',
  },
  exerciseList: {
    padding: 20,
  },
  exerciseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  exerciseCategory: {
    fontSize: 12,
    color: '#FF6B35',
    marginBottom: 6,
    fontWeight: '500',
  },
  exerciseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyTag: {
    backgroundColor: '#1a3a2a',
  },
  tagText: {
    color: '#999',
    fontSize: 10,
  },
  saveButton: {
    padding: 4,
  },
  muscleSection: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  muscleLabel: {
    color: '#666',
    fontSize: 12,
    marginRight: 6,
  },
  muscleText: {
    color: '#999',
    fontSize: 12,
    flex: 1,
  },
  exerciseImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 160,
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    color: '#666',
    fontSize: 14,
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  instructionText: {
    color: '#999',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  attributionSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  attributionText: {
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  savedButton: {
    backgroundColor: '#FF6B35',
  },
  actionButtonText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  savedButtonText: {
    color: 'white',
  },
});