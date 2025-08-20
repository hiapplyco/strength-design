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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassSearchInput } from './GlassSearchInput';
// Note: expo-blur might need to be installed: npx expo install expo-blur
// For now, we'll use a fallback that doesn't require expo-blur
// import { BlurView } from 'expo-blur';
import PerplexitySearchService from '../services/PerplexitySearchService';

const { width, height } = Dimensions.get('window');

export default function ProgramSearchModal({ 
  visible, 
  onClose, 
  onProgramSelect,
  navigation 
}) {
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
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  useEffect(() => {
    // Check if API key is configured
    // In production, this would check environment variables or secure storage
    const checkApiKey = async () => {
      try {
        // Configure the Perplexity API key
        const apiKey = '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';
        PerplexitySearchService.setApiKey(apiKey);
        setApiKeyConfigured(true); // API key is now configured
        console.log('✅ Perplexity API configured successfully');
      } catch (error) {
        console.error('Error checking API configuration:', error);
        setApiKeyConfigured(false);
      }
    };

    if (visible) {
      checkApiKey();
    }
  }, [visible]);

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

    // API key is now configured, proceed with real search
    // Remove the demo results fallback since we have a real API key

    setLoading(true);
    try {
      // Validate search query
      if (searchQuery.length < 3) {
        throw new Error('Search term must be at least 3 characters long');
      }

      const results = await PerplexitySearchService.searchPrograms(searchQuery, selectedFilters);
      
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
      
      // Show demo results as fallback
      if (searchResults.length === 0) {
        console.log('Showing demo results as fallback');
        showDemoResults();
      }
    } finally {
      setLoading(false);
    }
  };

  const showDemoResults = () => {
    // Demo results for development and testing
    const demoResults = [
      {
        id: 'demo1',
        name: "Jim Wendler's 5/3/1",
        creator: 'Jim Wendler (Powerlifting Coach)',
        goals: 'Strength Building',
        experienceLevel: 'Intermediate to Advanced',
        duration: '4-week cycles, ongoing',
        credibilityScore: 9,
        methodology: 'Progressive percentage-based training with assistance work',
        structure: '4 main lifts per cycle, 3 training days per week',
        source: 'Elite FTS, Multiple Publications'
      },
      {
        id: 'demo2',
        name: 'StrongLifts 5x5',
        creator: 'Mehdi Hadim (Certified Trainer)',
        goals: 'Beginner Strength',
        experienceLevel: 'Beginner',
        duration: '12+ weeks',
        credibilityScore: 8,
        methodology: 'Linear progression with compound movements',
        structure: '5 sets of 5 reps, 3 days per week',
        source: 'StrongLifts.com'
      },
      {
        id: 'demo3',
        name: 'Upper/Lower Split',
        creator: 'Lyle McDonald (Exercise Physiologist)',
        goals: 'Muscle Gain',
        experienceLevel: 'Intermediate',
        duration: '8-16 weeks',
        credibilityScore: 9,
        methodology: 'Volume-based training with optimal recovery',
        structure: '4 days per week, alternating upper and lower body',
        source: 'Body Recomposition'
      },
      {
        id: 'demo4',
        name: 'Push Pull Legs (PPL)',
        creator: 'Jeff Nippard (Science-based Training)',
        goals: 'Hypertrophy & Strength',
        experienceLevel: 'Intermediate to Advanced',
        duration: '6-12 weeks',
        credibilityScore: 9,
        methodology: 'High frequency training with scientific periodization',
        structure: '6 days per week, push/pull/legs rotation',
        source: 'Jeff Nippard Programs'
      },
      {
        id: 'demo5',
        name: 'Couch to 5K',
        creator: 'Josh Clark (Running Coach)',
        goals: 'Cardiovascular Endurance',
        experienceLevel: 'Beginner',
        duration: '9 weeks',
        credibilityScore: 8,
        methodology: 'Gradual run/walk intervals building to continuous running',
        structure: '3 days per week, 30-minute sessions',
        source: 'Cool Running, NHS, Multiple Health Organizations'
      }
    ];

    // Filter demo results based on search query and filters
    let filteredResults = demoResults;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredResults = filteredResults.filter(program => 
        program.name.toLowerCase().includes(query) ||
        program.goals.toLowerCase().includes(query) ||
        program.methodology.toLowerCase().includes(query)
      );
    }

    setSearchResults(filteredResults);
  };

  const selectProgram = async (program) => {
    try {
      Alert.alert(
        'Use This Program?',
        `Do you want to use "${program.name}" by ${program.creator} as a starting point for your workout generation?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Use This',
            onPress: async () => {
              setLoading(true);
              try {
                // Get detailed program information
                let programDetails = program;
                
                if (apiKeyConfigured) {
                  programDetails = await PerplexitySearchService.getProgramDetails(
                    program.name, 
                    program.creator
                  );
                }

                // Pass program to parent component
                onProgramSelect(programDetails);
                onClose();
              } catch (error) {
                console.error('Error getting program details:', error);
                // Still pass the basic program info if detailed fetch fails
                onProgramSelect(program);
                onClose();
              } finally {
                setLoading(false);
              }
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

  const renderProgramCard = (program) => (
    <TouchableOpacity
      key={program.id}
      style={styles.programCard}
      onPress={() => selectProgram(program)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.programCardGradient}
      >
        {/* Credibility Score Badge */}
        <View style={styles.credibilityBadge}>
          <Ionicons 
            name="shield-checkmark" 
            size={16} 
            color={program.credibilityScore >= 8 ? '#4CAF50' : '#FFB86B'} 
          />
          <Text style={[
            styles.credibilityScore,
            { color: program.credibilityScore >= 8 ? '#4CAF50' : '#FFB86B' }
          ]}>
            {program.credibilityScore}/10
          </Text>
        </View>

        {/* Program Header */}
        <View style={styles.programHeader}>
          <Text style={styles.programName}>{program.name}</Text>
          <Text style={styles.programCreator}>by {program.creator}</Text>
        </View>

        {/* Program Details */}
        <View style={styles.programDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="target" size={16} color="#FFB86B" />
            <Text style={styles.detailText}>{program.goals}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="trending-up" size={16} color="#FFB86B" />
            <Text style={styles.detailText}>{program.experienceLevel}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color="#FFB86B" />
            <Text style={styles.detailText}>{program.duration}</Text>
          </View>
        </View>

        {/* Program Methodology */}
        <Text style={styles.programMethodology} numberOfLines={2}>
          {program.methodology}
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

  const renderApiKeyWarning = () => (
    <View style={styles.warningContainer}>
      <Ionicons name="warning" size={24} color="#FFB86B" />
      <Text style={styles.warningTitle}>Demo Mode</Text>
      <Text style={styles.warningText}>
        Perplexity API key not configured. Showing demo programs for testing.
        {'\n\n'}To enable live search, configure your Perplexity API key in the app settings.
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
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

            {/* API Key Warning */}
            {!apiKeyConfigured && renderApiKeyWarning()}

            {/* Search Section */}
            <View style={styles.searchSection}>
              <GlassSearchInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for workout programs (e.g., '5/3/1', 'beginner strength')"
                onSubmit={searchPrograms}
                containerStyle={styles.searchInputContainer}
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
                  {searchResults.map(renderProgramCard)}
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
        </View>
      </View>
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
  warningContainer: {
    backgroundColor: 'rgba(255, 184, 107, 0.1)',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 107, 0.3)',
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFB86B',
    marginTop: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
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