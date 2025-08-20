import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Dimensions,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, functions } from '../firebaseConfig';
import { GlassContainer, GlassCard } from '../components/GlassmorphismComponents';
import { GlassSearchInput } from '../components/GlassSearchInput';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchContext } from '../contexts/SearchContext';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// Import enhanced search components directly without try/catch
import { useExerciseSearch } from '../hooks/useExerciseSearch';
import SearchSuggestions from '../components/SearchSuggestions';
import SearchFilters from '../components/SearchFilters';
import SearchResults from '../components/SearchResults';

const { width: screenWidth } = Dimensions.get('window');

// Local SVG placeholder for exercises without images - no external dependencies
const getExercisePlaceholder = (category, name) => {
  const categoryColors = {
    strength: 'FF6B35',
    cardio: '4CAF50',
    stretching: '2196F3',
    plyometrics: 'FF5722',
    powerlifting: '795548',
    olympic: '9C27B0',
    strongman: '795548',
    calisthenics: '9C27B0',
    default: '666666'
  };
  
  const color = categoryColors[category?.toLowerCase()] || categoryColors.default;
  const displayName = name ? name.substring(0, 20) : 'Exercise';
  
  // Create a simple SVG with exercise name and category color
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23${color}' opacity='0.05'/%3E%3Crect x='0' y='170' width='300' height='30' fill='%23${color}' opacity='0.1'/%3E%3Cg transform='translate(150, 85)'%3E%3Ccircle r='40' fill='none' stroke='%23${color}' stroke-width='2' opacity='0.3'/%3E%3Cpath d='M-20,-10 L-10,-10 L-10,10 L-20,10 M10,-10 L20,-10 L20,10 L10,10 M-10,-5 L10,-5' stroke='%23${color}' stroke-width='2' fill='none' opacity='0.4'/%3E%3C/g%3E%3Ctext x='150' y='188' text-anchor='middle' fill='%23${color}' font-family='system-ui' font-size='11' font-weight='500' opacity='0.7'%3E${displayName}%3C/text%3E%3C/svg%3E`;
};

export default function CleanExerciseLibraryScreen({ navigation }) {
  const theme = useTheme();
  const { addExercise, addToHistory, selectedExercises } = useSearchContext();
  
  // Enhanced search hook - replaces all manual search logic
  const {
    searchQuery,
    exercises,
    isLoading,
    error,
    searchTime,
    resultCount,
    searchSummary,
    hasActiveSearch,
    highlightTerms,
    searchSuggestions,
    showSuggestions,
    recentSearches,
    popularSearches,
    activeFilters,
    activeFilterCount,
    updateSearchQuery,
    updateFilters,
    addFilter,
    removeFilter,
    clearAllFilters,
    clearSearch,
    selectSuggestion,
    applyPreset,
    setShowSuggestions
  } = useExerciseSearch();

  // Local UI state
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [savedExercises, setSavedExercises] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load saved exercises from user's collection
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

  // Initial load
  useEffect(() => {
    loadSavedExercises();
  }, [loadSavedExercises]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    // The enhanced search hook will handle the actual refresh
    loadSavedExercises();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [loadSavedExercises]);

  // Save/unsave exercise
  const toggleSaveExercise = async (exercise) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('Please sign in to save exercises');
        return;
      }

      const savedRef = doc(db, 'users', user.uid, 'savedExercises', exercise.id);
      const isCurrentlySaved = savedExercises.some(e => e.id === exercise.id);

      if (isCurrentlySaved) {
        await deleteDoc(savedRef);
        setSavedExercises(prev => prev.filter(e => e.id !== exercise.id));
      } else {
        await setDoc(savedRef, {
          ...exercise,
          savedAt: new Date().toISOString()
        });
        setSavedExercises(prev => [...prev, exercise]);
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
    }
  };

  // Handle search input changes
  const handleSearchInputChange = (text) => {
    updateSearchQuery(text);
    setShowSuggestions(text.length > 0);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    selectSuggestion(suggestion);
    setShowSuggestions(false);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    updateFilters(newFilters);
  };

  // Clear recent searches
  const handleClearRecentSearches = async () => {
    try {
      const { storageService } = await import('../services/storageService');
      await storageService.clearRecentSearches();
      // The hook will automatically update when we reload
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  };

  // Landing page when no search/filters
  const LandingPage = () => (
    <ScrollView style={styles.landingContainer}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        style={styles.landingHero}
      >
        <Ionicons name="barbell-outline" size={48} color="white" />
        <Text style={styles.landingTitle}>Exercise Library</Text>
        <Text style={styles.landingSubtitle}>
          Search our database of 872+ exercises with AI-powered search
        </Text>
      </LinearGradient>

      <View style={styles.landingContent}>
        <Text style={styles.landingPrompt}>
          Start by searching for an exercise or try our smart suggestions
        </Text>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Searches</Text>
          <View style={styles.quickFiltersGrid}>
            {['chest workout', 'leg day', 'arms'].map(query => (
              <TouchableOpacity
                key={query}
                style={styles.quickFilterCard}
                onPress={() => handleSuggestionSelect(query)}
              >
                <Text style={styles.quickFilterText}>
                  {query.charAt(0).toUpperCase() + query.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {savedExercises.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.sectionTitle}>Your Saved Exercises</Text>
            <TouchableOpacity
              style={styles.viewSavedButton}
              onPress={() => {
                handleFiltersChange({ ...activeFilters, saved: true });
              }}
            >
              <Text style={styles.viewSavedText}>
                View {savedExercises.length} saved exercises
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <View style={styles.recentSearches}>
              {recentSearches.slice(0, 5).map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentSearchItem}
                  onPress={() => handleSuggestionSelect(search)}
                >
                  <Ionicons name="time-outline" size={14} color="#666" />
                  <Text style={styles.recentSearchText}>{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Exercise Library</Text>
          <Text style={styles.headerSubtitle}>Browse and save exercises</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => clearSearch()}
            style={styles.headerButton}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Enhanced Search Bar - positioned under header */}
      <View style={styles.searchContainer}>
        <GlassSearchInput
          value={searchQuery}
          onChangeText={handleSearchInputChange}
          placeholder="Search exercises, muscles, equipment..."
          onSubmit={() => setShowSuggestions(false)}
          containerStyle={styles.searchBar}
        />
        
        {/* Search Suggestions */}
        <SearchSuggestions
          suggestions={searchSuggestions}
          recentSearches={recentSearches}
          popularSearches={popularSearches}
          isVisible={showSuggestions}
          searchQuery={searchQuery}
          onSuggestionSelect={handleSuggestionSelect}
          onClearRecent={handleClearRecentSearches}
        />
      </View>

      {/* Enhanced Filters */}
      <SearchFilters
        activeFilters={activeFilters}
        onFiltersChange={handleFiltersChange}
        onClearAll={clearAllFilters}
        isVisible={showFilters}
        onToggleVisibility={() => setShowFilters(!showFilters)}
      />

      {/* Main Content */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B35" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              // Reload the screen by clearing error and triggering search
              updateSearchQuery(searchQuery || 'test');
              setTimeout(() => updateSearchQuery(searchQuery), 100);
            }}
          >
            <LinearGradient
              colors={['#FF6B35', '#F7931E']}
              style={styles.retryButtonGradient}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : !hasActiveSearch ? (
        <LandingPage />
      ) : (
        <SearchResults
          exercises={exercises}
          searchQuery={searchQuery}
          highlightTerms={highlightTerms}
          searchSummary={searchSummary}
          isLoading={isLoading}
          onExercisePress={setSelectedExercise}
          onToggleSave={toggleSaveExercise}
          savedExercises={savedExercises}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <Modal
          visible={!!selectedExercise}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedExercise(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Image
                  source={{ uri: selectedExercise.images?.[0] || getExercisePlaceholder(selectedExercise.category, selectedExercise.name) }}
                  style={styles.modalImage}
                />
                <View style={styles.modalBody}>
                  <Text style={styles.modalTitle}>{selectedExercise.name}</Text>
                  <Text style={styles.modalCategory}>{selectedExercise.category}</Text>
                  
                  {selectedExercise.description && (
                    <Text style={styles.modalDescription}>{selectedExercise.description}</Text>
                  )}
                  
                  {selectedExercise.instructions && (
                    <View style={styles.instructionsSection}>
                      <Text style={styles.sectionTitle}>Instructions</Text>
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
                  style={styles.modalButton}
                  onPress={() => toggleSaveExercise(selectedExercise)}
                >
                  <Ionicons
                    name={savedExercises.some(e => e.id === selectedExercise.id) ? "heart" : "heart-outline"}
                    size={20}
                    color="#FF6B35"
                  />
                  <Text style={styles.modalButtonText}>
                    {savedExercises.some(e => e.id === selectedExercise.id) ? 'Saved' : 'Save'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.closeButton]}
                  onPress={() => setSelectedExercise(null)}
                >
                  <Text style={[styles.modalButtonText, styles.closeButtonText]}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
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
  headerButton: {
    padding: 5,
  },
  activeButton: {
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
    maxHeight: 50,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
  
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 12,
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    marginTop: 10,
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    marginTop: 20,
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 8,
  },
  
  // Landing page
  landingContainer: {
    flex: 1,
  },
  landingHero: {
    padding: 40,
    alignItems: 'center',
  },
  landingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
  },
  landingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  landingContent: {
    padding: 20,
  },
  landingPrompt: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  quickActions: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  quickFiltersGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickFilterCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  quickFilterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  savedSection: {
    marginTop: 20,
  },
  viewSavedButton: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  viewSavedText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Exercise list
  exerciseList: {
    padding: 20,
  },
  exerciseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  exerciseImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#0a0a0a',
  },
  exerciseContent: {
    padding: 15,
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
    marginBottom: 8,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultybeginner: {
    backgroundColor: '#4CAF50',
  },
  difficultyintermediate: {
    backgroundColor: '#FF9800',
  },
  difficultyadvanced: {
    backgroundColor: '#F44336',
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  saveButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    padding: 5,
  },
  
  // Modal
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
  modalImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#0a0a0a',
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  modalCategory: {
    fontSize: 14,
    color: '#FF6B35',
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginBottom: 20,
  },
  instructionsSection: {
    marginTop: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  modalButtonText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#FF6B35',
  },
  closeButtonText: {
    color: 'white',
  },
  
  // New styles for enhanced search
  recentSection: {
    marginTop: 20,
  },
  recentSearches: {
    gap: 8,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recentSearchText: {
    color: '#999',
    fontSize: 14,
  },
});