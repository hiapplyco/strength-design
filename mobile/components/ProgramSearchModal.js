/**
 * Program Search Modal Component
 * Provides sophisticated search interface for workout programs using Perplexity API
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassSearchInput } from './GlassSearchInput';
import { useTheme } from '../contexts/ThemeContext';
// Note: expo-blur might need to be installed: npx expo install expo-blur
// For now, we'll use a fallback that doesn't require expo-blur
// import { BlurView } from 'expo-blur';
import programSearchService from '../services/ProgramSearchService';

const { width, height } = Dimensions.get('window');

export default function ProgramSearchModal({ 
  visible, 
  onClose, 
  onProgramSelect,
  navigation 
}) {
  const { theme, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    experienceLevel: 'any',
    goals: 'any',
    equipment: 'any',
    duration: 'any'
  });
  const [showFilters, setShowFilters] = useState(false);

  const filterOptions = {
    experienceLevel: ['any', 'beginner', 'intermediate', 'advanced'],
    goals: ['any', 'strength', 'muscle gain', 'fat loss', 'endurance', 'general fitness'],
    equipment: ['any', 'bodyweight', 'basic gym', 'full gym', 'home equipment'],
    duration: ['any', '4-6 weeks', '8-12 weeks', '12+ weeks', 'ongoing']
  };

  const searchPrograms = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search Required', 'Please enter a search term for workout programs');
      return;
    }

    setLoading(true);
    try {
      // Validate search query
      if (searchQuery.length < 2) {
        throw new Error('Search term must be at least 2 characters long');
      }

      // Call Firebase Function through the service
      const response = await programSearchService.searchPrograms(searchQuery, {
        searchType: 'general',
        focus: selectedFilters.goals !== 'any' ? [selectedFilters.goals] : [],
        difficulty: selectedFilters.experienceLevel !== 'any' ? selectedFilters.experienceLevel : undefined,
        duration: selectedFilters.duration !== 'any' ? selectedFilters.duration : undefined,
        equipment: selectedFilters.equipment !== 'any' ? [selectedFilters.equipment] : []
      });
      
      // Extract programs from response
      const results = response.programs || [];
      
      // Validate results
      if (!Array.isArray(results)) {
        throw new Error('Invalid search results format');
      }

      setSearchResults(results);
      
      if (results.length === 0) {
        Alert.alert(
          'No Results', 
          'No programs found matching your criteria. Try adjusting your search terms or filters.'
        );
      }
    } catch (error) {
      console.error('Search error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to search programs. Please try again.';
      
      if (error.message.includes('network') || error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Search timed out. Please try again with a simpler search term.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'API configuration error. Please contact support.';
      } else if (error.message.length > 0 && error.message.length < 100) {
        errorMessage = error.message;
      }

      Alert.alert('Search Error', errorMessage);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };


  const selectProgram = async (program) => {
    try {
      Alert.alert(
        'Use This Program?',
        `Do you want to use "${program.name}" as a starting point for your workout generation?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Use This',
            onPress: async () => {
              // Ensure comprehensive program data is passed
              const enrichedProgram = {
                ...program,
                // Core program information
                name: program.name || 'Unknown Program',
                creator: program.creator || program.source || 'Unknown',
                description: program.description || program.overview || program.methodology || '',
                
                // Program characteristics
                focus: Array.isArray(program.focus) ? program.focus : (program.focus ? [program.focus] : ['General Fitness']),
                difficulty: program.difficulty || program.experienceLevel || 'Beginner',
                duration: program.duration || 'Variable',
                popularity: program.popularity || program.credibilityScore || 85,
                source: program.source || 'Perplexity Search',
                
                // Detailed program structure
                exercises: program.exercises || program.workouts || program.structure || [],
                equipment: Array.isArray(program.equipment) ? program.equipment : (program.equipment ? [program.equipment] : ['Basic gym equipment']),
                schedule: program.schedule || program.frequency || '3-4 days per week',
                
                // Program methodology and principles
                methodology: program.methodology || program.approach || program.principles || '',
                goals: Array.isArray(program.goals) ? program.goals : (program.goals ? [program.goals] : program.focus || ['General Fitness']),
                principles: program.principles || program.keyPoints || [],
                
                // Additional context for AI
                overview: program.overview || program.description || '',
                structure: program.structure || program.workouts || program.exercises || [],
                experienceLevel: program.experienceLevel || program.difficulty || 'Beginner',
                
                // Selection metadata
                selectedAt: new Date().toISOString(),
                selectedFrom: 'ProgramSearchModal',
                searchFilters: selectedFilters
              };
              
              console.log('📋 Program selected with enriched data:', {
                name: enrichedProgram.name,
                hasExercises: Array.isArray(enrichedProgram.exercises) && enrichedProgram.exercises.length > 0,
                hasStructure: Array.isArray(enrichedProgram.structure) && enrichedProgram.structure.length > 0,
                hasMethodology: Boolean(enrichedProgram.methodology),
                equipmentCount: Array.isArray(enrichedProgram.equipment) ? enrichedProgram.equipment.length : 0,
                goalsCount: Array.isArray(enrichedProgram.goals) ? enrichedProgram.goals.length : 0,
                hasPrinciples: Array.isArray(enrichedProgram.principles) && enrichedProgram.principles.length > 0
              });
              
              // Pass enriched program to parent component
              onProgramSelect(enrichedProgram);
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error selecting program:', error);
      Alert.alert('Error', 'Failed to select program. Please try again.');
    }
  };

  const updateFilter = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({
      experienceLevel: 'any',
      goals: 'any',
      equipment: 'any',
      duration: 'any'
    });
  };

  const renderFilterSection = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filtersHeader}>
        <Text style={styles.filtersTitle}>Search Filters</Text>
        <TouchableOpacity onPress={clearFilters}>
          <Text style={styles.clearFiltersText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {Object.keys(filterOptions).map((filterType) => (
        <View key={filterType} style={styles.filterGroup}>
          <Text style={styles.filterLabel}>
            {filterType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterOptions}>
              {filterOptions[filterType].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOption,
                    selectedFilters[filterType] === option && styles.filterOptionSelected
                  ]}
                  onPress={() => updateFilter(filterType, option)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedFilters[filterType] === option && styles.filterOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      ))}
    </View>
  );

  const renderProgramCard = (program, index) => (
    <TouchableOpacity
      key={`${program.name}-${index}`}
      style={styles.programCard}
      onPress={() => selectProgram(program)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.programCardGradient}
      >
        {/* Popularity Badge */}
        <View style={styles.credibilityBadge}>
          <Ionicons 
            name="star" 
            size={16} 
            color={program.popularity >= 80 ? '#4CAF50' : '#FFB86B'} 
          />
          <Text style={[
            styles.credibilityScore,
            { color: program.popularity >= 80 ? '#4CAF50' : '#FFB86B' }
          ]}>
            {Math.round(program.popularity)}%
          </Text>
        </View>

        {/* Program Header */}
        <View style={styles.programHeader}>
          <Text style={styles.programName}>{program.name.replace(/\*\*/g, '')}</Text>
          <Text style={styles.programCreator}>{program.source}</Text>
        </View>

        {/* Program Details */}
        <View style={styles.programDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="target" size={16} color="#FFB86B" />
            <Text style={styles.detailText}>{Array.isArray(program.focus) ? program.focus.join(', ') : 'General'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="trending-up" size={16} color="#FFB86B" />
            <Text style={styles.detailText}>{program.difficulty || 'All levels'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color="#FFB86B" />
            <Text style={styles.detailText}>{program.duration}</Text>
          </View>
        </View>

        {/* Program Overview */}
        <Text style={styles.programMethodology} numberOfLines={2}>
          {program.overview || program.description}
        </Text>

        {/* Select Button */}
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={(e) => {
            e.stopPropagation();
            selectProgram(program);
          }}
        >
          <LinearGradient
            colors={['#FF7E87', '#FFB86B']}
            style={styles.selectButtonGradient}
          >
            <Text style={styles.selectButtonText}>Use This Program</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderSearchInfo = () => (
    <View style={[styles.infoContainer, { 
      backgroundColor: isDarkMode ? '#1C1C1E' : '#F5F5F5',
      borderColor: isDarkMode ? '#4CAF5030' : '#4CAF5020'
    }]}>
      <View style={styles.infoGraphic}>
        <Ionicons name="search" size={32} color="#4CAF50" />
        <View style={styles.pulseCircle} />
      </View>
      <Text style={[styles.infoTitle, { color: isDarkMode ? '#FFF' : '#000' }]}>
        Discover Proven Programs
      </Text>
      <Text style={[styles.infoText, { color: isDarkMode ? '#AAA' : '#666' }]}>
        Search thousands of workout programs from certified trainers and use them as templates for your personalized routine.
      </Text>
      <View style={styles.featuresRow}>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.featureText}>Expert-designed</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.featureText}>Customizable</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <LinearGradient
                colors={['rgba(26, 26, 30, 0.95)', 'rgba(44, 44, 62, 0.95)']}
                style={styles.modalContent}
              >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="search" size={24} color="#FFB86B" />
                <Text style={styles.headerTitle}>Find Workout Programs</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Search Info */}
            {searchResults.length === 0 && !loading && renderSearchInfo()}

            {/* Search Section */}
            <View style={styles.searchSection}>
              <GlassSearchInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for workout programs (e.g., '5/3/1', 'beginner strength')"
                onSubmit={searchPrograms}
              />

              <View style={styles.searchActions}>
                <TouchableOpacity
                  style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Ionicons name="options" size={20} color={showFilters ? '#FFB86B' : '#666'} />
                  <Text style={[
                    styles.filterToggleText,
                    showFilters && styles.filterToggleTextActive
                  ]}>
                    Filters
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={searchPrograms}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#FF7E87', '#FFB86B']}
                    style={styles.searchButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="search" size={18} color="#FFF" />
                        <Text style={styles.searchButtonText}>Search</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Filters */}
            {showFilters && renderFilterSection()}

            {/* Results */}
            <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
              {loading && searchResults.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFB86B" />
                  <Text style={styles.loadingText}>Searching for programs...</Text>
                </View>
              ) : searchResults.length > 0 ? (
                <View style={styles.resultsList}>
                  <Text style={styles.resultsHeader}>
                    Found {searchResults.length} Program{searchResults.length !== 1 ? 's' : ''}
                  </Text>
                  {searchResults.map((program, index) => renderProgramCard(program, index))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={64} color="#666" />
                  <Text style={styles.emptyTitle}>No Programs Found</Text>
                  <Text style={styles.emptyText}>
                    Try searching for specific program names like "5/3/1", "StrongLifts", 
                    or general terms like "beginner strength training"
                  </Text>
                </View>
              )}
            </ScrollView>
              </LinearGradient>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 50 : 25,
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  infoContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  infoGraphic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    transform: [{ scale: 1.5 }],
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  searchSection: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  searchIcon: {
    marginLeft: 16,
  },
  searchInput: {
    flex: 1,
    padding: 16,
    paddingLeft: 12,
    color: '#FFF',
    fontSize: 16,
  },
  searchActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterToggleActive: {
    backgroundColor: 'rgba(255, 184, 107, 0.2)',
  },
  filterToggleText: {
    color: '#666',
    marginLeft: 8,
    fontSize: 14,
  },
  filterToggleTextActive: {
    color: '#FFB86B',
  },
  searchButton: {
    borderRadius: 12,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  filtersContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  clearFiltersText: {
    color: '#FFB86B',
    fontSize: 14,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 8,
    fontWeight: '600',
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterOptionSelected: {
    backgroundColor: 'rgba(255, 184, 107, 0.3)',
    borderColor: '#FFB86B',
  },
  filterOptionText: {
    color: '#FFF',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  filterOptionTextSelected: {
    color: '#FFB86B',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 16,
  },
  resultsList: {
    padding: 16,
  },
  resultsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  programCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  programCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  credibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  credibilityScore: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  programHeader: {
    marginBottom: 12,
  },
  programName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  programCreator: {
    fontSize: 14,
    color: '#FFB86B',
  },
  programDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 8,
  },
  programMethodology: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  selectButton: {
    borderRadius: 12,
  },
  selectButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});