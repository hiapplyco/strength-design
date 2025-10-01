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
import { auth } from '../firebaseConfig';
import { BlurView } from 'expo-blur';
import { Video } from 'expo-av';

import exercisesData from '../assets/exercises.json';

const { width: screenWidth } = Dimensions.get('window');

export default function ExerciseLibraryScreen({ navigation }) {
  const [allExercises, setAllExercises] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [savedExercises, setSavedExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [types, setTypes] = useState(['all']);
  const [muscles, setMuscles] = useState(['all']);

  const fetchExercises = useCallback(() => {
    setLoading(true);
    try {
      if (!Array.isArray(exercisesData)) {
        throw new Error('Exercise data is not in the expected format.');
      }
      
      setAllExercises(exercisesData);
      setExercises(exercisesData.slice(0, 30)); // Show initial exercises

      const allTypes = new Set(['all']);
      const allMuscles = new Set(['all']);
      exercisesData.forEach(ex => {
        ex.type.forEach(t => allTypes.add(t));
        ex.primary_muscles.forEach(m => allMuscles.add(m));
      });
      setTypes(Array.from(allTypes));
      setMuscles(Array.from(allMuscles));

    } catch (error) {
      Alert.alert('Error Loading Exercises', 'Could not load exercise data.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
    loadSavedExercises();
  }, [fetchExercises]);

  const loadSavedExercises = async () => {
    // This function would fetch saved exercises from Firebase
  };

  const performSearch = () => {
    let results = allExercises;

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      results = results.filter(ex => ex.name.toLowerCase().includes(query));
    }

    if (selectedType !== 'all') {
      results = results.filter(ex => ex.type.includes(selectedType));
    }

    if (selectedMuscle !== 'all') {
      results = results.filter(ex => ex.primary_muscles.includes(selectedMuscle));
    }

    setExercises(results);
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
        performSearch();
    }, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, selectedType, selectedMuscle, allExercises]);


  const toggleSaveExercise = async (exercise) => {
    // This function would save/remove exercises in Firebase
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExercises().finally(() => setRefreshing(false));
  }, [fetchExercises]);

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
            <View style={styles.exerciseTags}>
              {item.type?.map(t => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
              {item.equipment?.map(eq => (
                <View key={eq} style={[styles.tag, styles.equipmentTag]}>
                  <Text style={styles.tagText}>{eq}</Text>
                </View>
              ))}
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
            <Text style={styles.muscleText}>{item.primary_muscles.join(', ')}</Text>
          </View>
        )}
        
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
    const video = React.useRef(null);
    
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
              
              {selectedExercise.video_url && (
                <Video
                  ref={video}
                  style={styles.video}
                  source={{
                    uri: selectedExercise.video_url,
                  }}
                  useNativeControls
                  resizeMode="contain"
                  isLooping
                />
              )}
              
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{selectedExercise.type?.join(', ') || 'N/A'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Equipment:</Text>
                  <Text style={styles.detailValue}>{selectedExercise.equipment?.join(', ') || 'None'}</Text>
                </View>
                
                {selectedExercise.primary_muscles && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Primary Muscles:</Text>
                    <Text style={styles.detailValue}>
                      {selectedExercise.primary_muscles.join(', ')}
                    </Text>
                  </View>
                )}
                
                {selectedExercise.secondary_muscles && selectedExercise.secondary_muscles.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Secondary Muscles:</Text>
                    <Text style={styles.detailValue}>
                      {selectedExercise.secondary_muscles.join(', ')}
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
                  navigation.navigate('WorkoutGenerator', { 
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
        <Text style={styles.headerTitle}>Exercise Library</Text>
        <TouchableOpacity 
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        >
          <Ionicons name="filter" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for exercises..."
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
            {types.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  selectedType === type && styles.filterChipActive
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedType === type && styles.filterChipTextActive
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {muscles.map(muscle => (
              <TouchableOpacity
                key={muscle}
                style={[
                  styles.filterChip,
                  selectedMuscle === muscle && styles.filterChipActive
                ]}
                onPress={() => setSelectedMuscle(muscle)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedMuscle === muscle && styles.filterChipTextActive
                ]}>
                  {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
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
                {exercises.length === 0 && searchQuery ? 'No exercises found' : 'No exercises available'}
              </Text>
              <Text style={styles.emptySubtext}>
                {exercises.length === 0 && searchQuery ? 'Try a different search' : 'Pull to refresh'}
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
  filterButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  searchBar: {
    flex: 1,
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
  filterChip: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterChipText: {
    color: '#999',
    fontSize: 13,
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
    marginBottom: 6,
  },
  exerciseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  equipmentTag: {
    backgroundColor: '#1a2a3a',
  },
  tagText: {
    color: '#999',
    fontSize: 11,
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
    height: 150,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  video: {
    width: screenWidth - 40,
    height: 200,
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailSection: {
    marginTop: 16,
  },
  detailLabel: {
    color: '#666',
    fontSize: 14,
    marginRight: 8,
    minWidth: 100,
  },
  detailValue: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  instructionText: {
    color: '#999',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
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