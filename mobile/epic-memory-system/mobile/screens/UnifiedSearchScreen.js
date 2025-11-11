import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { searchService } from '../services/searchService';
import NutritionService from '../services/NutritionService';
import { GlassContainer } from '../components/GlassmorphismComponents';
import { GlassSearchInput } from '../components/GlassSearchInput';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchContext } from '../contexts/SearchContext';
import { AppLogo } from '../components/AppLogo';
import GlobalContextButton from '../components/GlobalContextButton';
import GlobalContextStatusLine from '../components/GlobalContextStatusLine';
import sessionContextManager from '../services/sessionContextManager';

const { width: screenWidth } = Dimensions.get('window');

export default function UnifiedSearchScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { addExercise, addFood } = useSearchContext();
  const { exercisesOnly = false } = route?.params || {};
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ exercises: [], nutrition: [] });
  const [selectedItems, setSelectedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const neonAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Neon pulsing animation
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
  
  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ exercises: [], nutrition: [] });
      setShowExamples(true);
      return;
    }
    
    setShowExamples(false);
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 150); // Faster response time
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const performSearch = async (query) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    console.log('Searching for:', query);
    
    try {
      const results = { exercises: [], nutrition: [] };
      
      // Search exercises with correct parameter format
      try {
        // The searchExercises expects an object with query property
        const exerciseResult = await searchService.searchExercises({
          query: query,
          limit: 20
        });
        console.log('Exercise search result:', exerciseResult);
        
        if (exerciseResult && exerciseResult.exercises) {
          results.exercises = exerciseResult.exercises.slice(0, 15);
        } else if (exerciseResult && Array.isArray(exerciseResult)) {
          // Handle if it returns array directly
          results.exercises = exerciseResult.slice(0, 15);
        }
      } catch (exerciseError) {
        console.error('Exercise search error:', exerciseError);
        // Try simpler search as fallback
        try {
          const allExercises = searchService.getAllExercises();
          if (allExercises && Array.isArray(allExercises)) {
            const filtered = allExercises.filter(ex => 
              ex.name?.toLowerCase().includes(query.toLowerCase()) ||
              ex.category?.toLowerCase().includes(query.toLowerCase()) ||
              ex.primary_muscles?.some(m => m.toLowerCase().includes(query.toLowerCase()))
            );
            results.exercises = filtered.slice(0, 15);
          }
        } catch (fallbackError) {
          console.error('Fallback search error:', fallbackError);
        }
      }
      
      // Search nutrition if not exercises only
      if (!exercisesOnly) {
        try {
          const nutritionResult = await NutritionService.searchFoods(query);
          console.log('Nutrition search result:', nutritionResult);
          
          if (nutritionResult && nutritionResult.foods) {
            // Fix the nutrition data structure
            results.nutrition = nutritionResult.foods.map(food => {
              // Handle different food data structures
              if (typeof food === 'string') {
                return {
                  id: Math.random().toString(),
                  name: food,
                  brand: 'USDA',
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0
                };
              } else if (food && typeof food === 'object') {
                return {
                  id: food.id || food.fdcId || Math.random().toString(),
                  name: food.name || food.description || food.foodDescription || 'Unknown Food',
                  brand: food.brand || food.brandOwner || 'USDA',
                  calories: food.calories || food.foodNutrients?.find(n => n.nutrientName === 'Energy')?.value || 0,
                  protein: food.protein || food.foodNutrients?.find(n => n.nutrientName === 'Protein')?.value || 0,
                  carbs: food.carbs || food.foodNutrients?.find(n => n.nutrientName === 'Carbohydrate')?.value || 0,
                  fat: food.fat || food.foodNutrients?.find(n => n.nutrientName === 'Total lipid')?.value || 0,
                  serving: food.serving || { size: 100, unit: 'g' }
                };
              }
              return null;
            }).filter(Boolean).slice(0, 15);
          }
        } catch (nutritionError) {
          console.error('Nutrition search error:', nutritionError);
        }
      }
      
      console.log('Final search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ exercises: [], nutrition: [] });
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleSelection = (item, type) => {
    const itemWithType = { ...item, type };
    const isSelected = selectedItems.some(
      selected => selected.id === item.id && selected.type === type
    );
    
    if (isSelected) {
      setSelectedItems(selectedItems.filter(
        selected => !(selected.id === item.id && selected.type === type)
      ));
    } else {
      setSelectedItems([...selectedItems, itemWithType]);
    }
  };
  
  const addToContext = async () => {
    if (selectedItems.length === 0) return;
    
    const exercises = selectedItems.filter(item => item.type === 'exercise');
    const foods = selectedItems.filter(item => item.type === 'nutrition');
    
    // Add to search context
    exercises.forEach(ex => addExercise(ex));
    foods.forEach(food => addFood(food));
    
    // IMPORTANT: Also save to sessionContextManager for global context
    if (exercises.length > 0) {
      await sessionContextManager.addExercises(exercises, 'search');
    }
    if (foods.length > 0) {
      await sessionContextManager.addNutrition(foods, 'search');
    }
    
    // Clear selections after adding
    setSelectedItems([]);
    
    navigation.navigate('Generator', {
      fromSearch: true,
      searchContext: {
        exercises,
        foods,
        query: searchQuery
      }
    });
  };
  
  // Example card component
  const ExampleCard = ({ type, emoji, title, subtitle }) => (
    <View style={[styles.exampleCard, { 
      backgroundColor: isDarkMode ? '#2a2a2a' : '#FFFFFF',
      borderColor: isDarkMode ? '#3a3a3a' : '#E0E0E0'
    }]}>
      <Text style={styles.exampleEmoji}>{emoji}</Text>
      <View style={styles.exampleContent}>
        <Text style={[styles.exampleTitle, { 
          color: isDarkMode ? '#FFFFFF' : '#000000' 
        }]}>
          {title}
        </Text>
        <Text style={[styles.exampleSubtitle, { 
          color: isDarkMode ? '#AAAAAA' : '#666666' 
        }]}>
          {subtitle}
        </Text>
      </View>
      <View style={[styles.exampleBadge, {
        backgroundColor: type === 'exercise' ? '#FF6B35' : '#4CAF50'
      }]}>
        <Text style={styles.exampleBadgeText}>{type}</Text>
      </View>
    </View>
  );
  
  // Result card component
  const ResultCard = ({ item, type, isSelected, onPress }) => {
    const emoji = type === 'exercise' ? '💪' : '🍽️';
    const bgColor = isSelected 
      ? (type === 'exercise' ? '#FF6B35' : '#4CAF50')
      : (isDarkMode ? '#2a2a2a' : '#FFFFFF');
    
    // Ensure we have proper data
    const displayName = item.name || item.description || 'Unknown';
    const displaySubtitle = type === 'exercise' 
      ? `${item.category || 'General'} • ${item.equipment || 'No equipment'}`
      : `${item.brand || 'USDA'} • ${Math.round(item.calories || 0)} cal`;
    
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.resultCard, {
          backgroundColor: bgColor,
          borderColor: isSelected 
            ? bgColor 
            : (isDarkMode ? '#3a3a3a' : '#E0E0E0')
        }]}>
          <Text style={styles.resultEmoji}>{emoji}</Text>
          <View style={styles.resultContent}>
            <Text style={[styles.resultTitle, {
              color: isSelected ? '#FFFFFF' : (isDarkMode ? '#FFFFFF' : '#000000')
            }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.resultSubtitle, {
              color: isSelected ? '#FFFFFF' : (isDarkMode ? '#AAAAAA' : '#666666')
            }]} numberOfLines={1}>
              {displaySubtitle}
            </Text>
            {type === 'nutrition' && item.protein && (
              <Text style={[styles.resultNutrition, {
                color: isSelected ? '#FFFFFF' : (isDarkMode ? '#888888' : '#888888')
              }]} numberOfLines={1}>
                P: {Math.round(item.protein)}g • C: {Math.round(item.carbs || 0)}g • F: {Math.round(item.fat || 0)}g
              </Text>
            )}
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, { 
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' 
    }]}>
      {/* Global Context Status Line */}
      <GlobalContextStatusLine navigation={navigation} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDarkMode ? '#FFFFFF' : '#000000'} 
            />
          </TouchableOpacity>
          
          <GlobalContextButton 
            navigation={navigation}
            style={styles.headerLogo}
          />
        </View>
        
        {/* Context Summary Widget */}
        
        {/* Main Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Neon Title Section - Matching other pages */}
          {showExamples && (
            <View style={styles.titleSection}>
              <Animated.Text style={[
                styles.pageTitle,
                {
                  color: neonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: isDarkMode ? ['#FFFFFF', '#00F0FF'] : ['#000000', '#00F0FF'],
                  }),
                  textShadowColor: neonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['transparent', '#00F0FF'],
                  }),
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: neonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 30],
                  }),
                },
              ]}>
                SEARCH
              </Animated.Text>
              <Text style={[styles.pageSubtitle, { 
                color: isDarkMode ? '#AAAAAA' : '#666666' 
              }]}>
                Find exercises and nutrition info
              </Text>
            </View>
          )}
          
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <GlassSearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Try 'chest exercises' or 'chicken breast'"
              autoFocus={false}
              containerStyle={styles.searchInput}
            />
          </View>
          
          {/* Examples or Results */}
          {showExamples ? (
            <View style={styles.examplesSection}>
              <Text style={[styles.sectionTitle, { 
                color: isDarkMode ? '#FFFFFF' : '#000000' 
              }]}>
                Examples
              </Text>
              
              <ExampleCard
                type="exercise"
                emoji="💪"
                title="chest exercises"
                subtitle="Will show exercises in left column"
              />
              
              <ExampleCard
                type="nutrition"
                emoji="🍗"
                title="chicken breast"
                subtitle="Will show nutrition in right column"
              />
              
              <ExampleCard
                type="exercise"
                emoji="🏃"
                title="leg workout"
                subtitle="Try: squats, lunges, leg press"
              />
              
              <View style={styles.searchTips}>
                <Text style={[styles.tipTitle, { 
                  color: isDarkMode ? '#FFFFFF' : '#000000' 
                }]}>
                  Search Tips:
                </Text>
                <Text style={[styles.tipText, { 
                  color: isDarkMode ? '#AAAAAA' : '#666666' 
                }]}>
                  • Exercises appear in the left column{'\n'}
                  • Nutrition info appears in the right column{'\n'}
                  • Try: "chest workout", "protein sources"{'\n'}
                  • Select items to add to your workout
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.resultsSection}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
              ) : (
                <>
                  {/* Split Column Layout */}
                  {(searchResults.exercises.length > 0 || searchResults.nutrition.length > 0) ? (
                    <View style={styles.columnsContainer}>
                      {/* Exercise Column */}
                      {searchResults.exercises.length > 0 && (
                        <View style={[
                          styles.column,
                          !exercisesOnly && searchResults.nutrition.length > 0 && styles.leftColumn
                        ]}>
                          <View style={styles.columnHeader}>
                            <Text style={[styles.columnTitle, { 
                              color: isDarkMode ? '#FFFFFF' : '#000000' 
                            }]}>
                              💪 Exercises
                            </Text>
                            <Text style={[styles.columnCount, { 
                              color: isDarkMode ? '#AAAAAA' : '#666666' 
                            }]}>
                              {searchResults.exercises.length} results
                            </Text>
                          </View>
                          <ScrollView 
                            style={styles.columnScroll}
                            showsVerticalScrollIndicator={false}
                          >
                            {searchResults.exercises.map((item, index) => (
                              <ResultCard
                                key={`exercise-${index}`}
                                item={item}
                                type="exercise"
                                isSelected={selectedItems.some(
                                  s => s.id === item.id && s.type === 'exercise'
                                )}
                                onPress={() => toggleSelection(item, 'exercise')}
                              />
                            ))}
                          </ScrollView>
                        </View>
                      )}
                      
                      {/* Nutrition Column */}
                      {!exercisesOnly && searchResults.nutrition.length > 0 && (
                        <View style={[
                          styles.column,
                          searchResults.exercises.length > 0 && styles.rightColumn
                        ]}>
                          <View style={styles.columnHeader}>
                            <Text style={[styles.columnTitle, { 
                              color: isDarkMode ? '#FFFFFF' : '#000000' 
                            }]}>
                              🍽️ Nutrition
                            </Text>
                            <Text style={[styles.columnCount, { 
                              color: isDarkMode ? '#AAAAAA' : '#666666' 
                            }]}>
                              {searchResults.nutrition.length} results
                            </Text>
                          </View>
                          <ScrollView 
                            style={styles.columnScroll}
                            showsVerticalScrollIndicator={false}
                          >
                            {searchResults.nutrition.map((item, index) => (
                              <ResultCard
                                key={`nutrition-${index}`}
                                item={item}
                                type="nutrition"
                                isSelected={selectedItems.some(
                                  s => s.id === item.id && s.type === 'nutrition'
                                )}
                                onPress={() => toggleSelection(item, 'nutrition')}
                              />
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  ) : (
                    !isLoading && (
                      <View style={styles.noResults}>
                        <Ionicons 
                          name="search-outline" 
                          size={60} 
                          color={isDarkMode ? '#666666' : '#CCCCCC'} 
                        />
                        <Text style={[styles.noResultsText, { 
                          color: isDarkMode ? '#AAAAAA' : '#666666' 
                        }]}>
                          No results found for "{searchQuery}"
                        </Text>
                      </View>
                    )
                  )}
                </>
              )}
            </View>
          )}
        </ScrollView>
        
        {/* Action Button */}
        {selectedItems.length > 0 && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={addToContext}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF8F65']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.actionButtonText}>
                Add {selectedItems.length} items to workout
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerLogo: {
    position: 'absolute',
    right: 16,
    top: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif-black',
      default: 'System',
    }),
  },
  pageSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  mainLogo: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif-black',
      default: 'System',
    }),
    textTransform: 'uppercase',
  },
  titleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  searchInput: {
    marginHorizontal: 0,
  },
  examplesSection: {
    paddingHorizontal: 16,
  },
  resultsSection: {
    flex: 1,
  },
  columnsContainer: {
    flexDirection: 'row',
    flex: 1,
    paddingHorizontal: 8,
  },
  column: {
    flex: 1,
    paddingHorizontal: 8,
  },
  leftColumn: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(128, 128, 128, 0.2)',
    paddingRight: 8,
  },
  rightColumn: {
    paddingLeft: 8,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  columnCount: {
    fontSize: 12,
  },
  columnScroll: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  exampleEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  exampleContent: {
    flex: 1,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exampleSubtitle: {
    fontSize: 14,
  },
  exampleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exampleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  searchTips: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 6,
    marginHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  resultEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
  },
  resultNutrition: {
    fontSize: 11,
    marginTop: 2,
  },
  loader: {
    marginTop: 40,
  },
  noResults: {
    alignItems: 'center',
    paddingTop: 60,
  },
  noResultsText: {
    fontSize: 16,
    marginTop: 16,
  },
  actionButton: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    borderRadius: 25,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});