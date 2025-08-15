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
  Image,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { auth, db, functions } from '../firebaseConfig';
import { collection, doc, setDoc, deleteDoc, getDocs, addDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { searchService } from '../services/searchService';
import NutritionService from '../services/NutritionService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Natural Language Understanding Patterns
const NLU_PATTERNS = {
  // Exercise patterns
  exerciseIntents: [
    /(?:show|find|search|look for|get|need)\s+(?:exercises?|workouts?|movements?)\s+(?:for|to|that)?\s*(.+)/i,
    /(?:how to|ways to|exercises? to)\s+(?:train|work|hit|target|strengthen)\s+(.+)/i,
    /(?:best|good|effective)\s+(?:exercises?|workouts?)\s+for\s+(.+)/i,
    /(.+)\s+(?:exercises?|workouts?|movements?|training)/i,
  ],
  
  // Nutrition patterns
  nutritionIntents: [
    /(?:calories|protein|carbs?|fat|nutrition)\s+(?:in|for|of)\s+(.+)/i,
    /(?:how much|how many)\s+(?:calories|protein|carbs?|fat)\s+(?:in|does)\s+(.+)/i,
    /(?:nutritional?|macro|food)\s+(?:info|information|facts?|data)\s+(?:for|about|on)\s+(.+)/i,
    /(?:what(?:'s| is) (?:in|the nutrition of))\s+(.+)/i,
    /(.+)\s+(?:calories|nutrition|macros|protein|carbs?)/i,
  ],
  
  // Combined patterns
  mealPlanIntents: [
    /(?:meal|food|diet)\s+(?:for|after|before)\s+(?:workout|training|exercise)/i,
    /(?:what to|what should I)\s+eat\s+(?:for|to|after|before)\s+(.+)/i,
    /(?:pre|post)[-\s]?workout\s+(?:meal|food|nutrition|snack)/i,
  ],
  
  // Muscle groups
  muscleGroups: {
    chest: ['chest', 'pecs', 'pectoral', 'bench'],
    back: ['back', 'lats', 'latissimus', 'rhomboids', 'traps', 'trapezius'],
    shoulders: ['shoulders', 'delts', 'deltoids', 'shoulder'],
    arms: ['arms', 'biceps', 'triceps', 'forearms'],
    legs: ['legs', 'quads', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'thighs'],
    core: ['core', 'abs', 'abdominals', 'obliques', 'six pack'],
  },
  
  // Food categories
  foodCategories: {
    protein: ['protein', 'meat', 'chicken', 'beef', 'fish', 'eggs', 'tofu'],
    carbs: ['carbs', 'carbohydrates', 'rice', 'pasta', 'bread', 'oats', 'potato'],
    fats: ['fats', 'oils', 'nuts', 'avocado', 'butter', 'seeds'],
    vegetables: ['vegetables', 'veggies', 'greens', 'salad'],
    fruits: ['fruits', 'fruit', 'berries', 'apple', 'banana'],
    dairy: ['dairy', 'milk', 'cheese', 'yogurt'],
  }
};

// Intelligent Query Parser
const parseUserQuery = (query) => {
  const lowerQuery = query.toLowerCase().trim();
  const result = {
    originalQuery: query,
    type: 'mixed', // exercise, nutrition, or mixed
    exerciseIntent: null,
    nutritionIntent: null,
    muscleGroups: [],
    foodCategories: [],
    keywords: [],
    context: null
  };
  
  // Check for exercise intent
  for (const pattern of NLU_PATTERNS.exerciseIntents) {
    const match = lowerQuery.match(pattern);
    if (match) {
      result.type = 'exercise';
      result.exerciseIntent = match[1] || match[0];
      break;
    }
  }
  
  // Check for nutrition intent
  for (const pattern of NLU_PATTERNS.nutritionIntents) {
    const match = lowerQuery.match(pattern);
    if (match) {
      result.type = result.type === 'exercise' ? 'mixed' : 'nutrition';
      result.nutritionIntent = match[1] || match[0];
      break;
    }
  }
  
  // Check for meal plan intent
  for (const pattern of NLU_PATTERNS.mealPlanIntents) {
    if (pattern.test(lowerQuery)) {
      result.type = 'mixed';
      result.context = 'meal_planning';
      break;
    }
  }
  
  // Extract muscle groups
  for (const [group, keywords] of Object.entries(NLU_PATTERNS.muscleGroups)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      result.muscleGroups.push(group);
    }
  }
  
  // Extract food categories
  for (const [category, keywords] of Object.entries(NLU_PATTERNS.foodCategories)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      result.foodCategories.push(category);
    }
  }
  
  // Extract general keywords
  const words = lowerQuery.split(/\s+/);
  result.keywords = words.filter(word => 
    word.length > 3 && 
    !['show', 'find', 'search', 'look', 'need', 'want', 'what', 'how', 'for', 'the', 'that', 'with'].includes(word)
  );
  
  return result;
};

export default function UnifiedSearchScreen({ navigation, route }) {
  const { fromChat = false, chatContext = null } = route?.params || {};
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [parsedQuery, setParsedQuery] = useState(null);
  const [searchResults, setSearchResults] = useState({
    exercises: [],
    nutrition: [],
    suggestions: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, exercises, nutrition
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Load animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Intelligent search handler
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults({ exercises: [], nutrition: [], suggestions: [] });
      return;
    }
    
    setIsLoading(true);
    const parsed = parseUserQuery(query);
    setParsedQuery(parsed);
    
    try {
      const results = { exercises: [], nutrition: [], suggestions: [] };
      
      // Search based on intent
      if (parsed.type === 'exercise' || parsed.type === 'mixed') {
        // Search exercises
        const exerciseQuery = parsed.exerciseIntent || query;
        const exerciseResults = await searchService.searchExercises(exerciseQuery);
        
        // Filter by muscle groups if specified
        if (parsed.muscleGroups.length > 0) {
          results.exercises = exerciseResults.filter(ex => 
            parsed.muscleGroups.some(group => 
              ex.muscleGroups?.toLowerCase().includes(group) ||
              ex.category?.toLowerCase().includes(group)
            )
          );
        } else {
          results.exercises = exerciseResults;
        }
      }
      
      if (parsed.type === 'nutrition' || parsed.type === 'mixed') {
        // Search nutrition
        const nutritionQuery = parsed.nutritionIntent || query;
        const nutritionResults = await NutritionService.searchFoods(nutritionQuery);
        
        // Filter by food categories if specified
        if (parsed.foodCategories.length > 0) {
          results.nutrition = nutritionResults.filter(food => 
            parsed.foodCategories.some(category => 
              food.category?.toLowerCase().includes(category) ||
              food.name?.toLowerCase().includes(category)
            )
          );
        } else {
          results.nutrition = nutritionResults;
        }
      }
      
      // Generate smart suggestions based on context
      if (parsed.context === 'meal_planning') {
        results.suggestions = [
          { type: 'tip', text: 'Pre-workout: Focus on carbs for energy' },
          { type: 'tip', text: 'Post-workout: Prioritize protein for recovery' },
          { type: 'action', text: 'Create a meal plan', action: 'createMealPlan' }
        ];
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Add to chat context
  const addToContext = useCallback(() => {
    if (selectedItems.length === 0) return;
    
    // Prepare context data
    const contextData = {
      exercises: selectedItems.filter(item => item.type === 'exercise'),
      foods: selectedItems.filter(item => item.type === 'nutrition'),
      query: searchQuery,
      parsedIntent: parsedQuery
    };
    
    // Navigate back to chat with context
    navigation.navigate('Generator', {
      searchContext: contextData,
      message: `I found ${selectedItems.length} items for "${searchQuery}". Let me help you create a plan with these.`
    });
  }, [selectedItems, searchQuery, parsedQuery, navigation]);
  
  // Toggle item selection
  const toggleSelection = (item, type) => {
    const itemWithType = { ...item, type };
    const isSelected = selectedItems.some(
      selected => selected.id === item.id && selected.type === type
    );
    
    if (isSelected) {
      setSelectedItems(prev => 
        prev.filter(selected => !(selected.id === item.id && selected.type === type))
      );
    } else {
      setSelectedItems(prev => [...prev, itemWithType]);
      Vibration.vibrate(10);
    }
  };
  
  // Render exercise card
  const renderExerciseCard = ({ item }) => {
    const isSelected = selectedItems.some(
      selected => selected.id === item.id && selected.type === 'exercise'
    );
    
    return (
      <TouchableOpacity
        onPress={() => toggleSelection(item, 'exercise')}
        onLongPress={() => {
          setSelectedItem({ ...item, type: 'exercise' });
          setShowContextMenu(true);
          Vibration.vibrate(50);
        }}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.resultCard, isSelected && styles.selectedCard]}>
          <LinearGradient
            colors={isSelected ? ['#FF6B35', '#FF8F65'] : ['#1a1a1a', '#2a2a2a']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Ionicons 
                  name="fitness" 
                  size={24} 
                  color={isSelected ? '#FFF' : '#FF6B35'} 
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, isSelected && styles.selectedText]}>
                  {item.name}
                </Text>
                <Text style={[styles.cardSubtitle, isSelected && styles.selectedText]}>
                  {item.category} • {item.equipment || 'No equipment'}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              )}
            </View>
            
            {item.muscleGroups && (
              <View style={styles.tagContainer}>
                {item.muscleGroups.split(',').slice(0, 3).map((muscle, index) => (
                  <View key={index} style={[styles.tag, isSelected && styles.selectedTag]}>
                    <Text style={[styles.tagText, isSelected && styles.selectedTagText]}>
                      {muscle.trim()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  };
  
  // Render nutrition card
  const renderNutritionCard = ({ item }) => {
    const isSelected = selectedItems.some(
      selected => selected.id === item.id && selected.type === 'nutrition'
    );
    
    return (
      <TouchableOpacity
        onPress={() => toggleSelection(item, 'nutrition')}
        onLongPress={() => {
          setSelectedItem({ ...item, type: 'nutrition' });
          setShowContextMenu(true);
          Vibration.vibrate(50);
        }}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.resultCard, isSelected && styles.selectedCard]}>
          <LinearGradient
            colors={isSelected ? ['#4CAF50', '#66BB6A'] : ['#1a1a1a', '#2a2a2a']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(76,175,80,0.1)' }]}>
                <Ionicons 
                  name="nutrition" 
                  size={24} 
                  color={isSelected ? '#FFF' : '#4CAF50'} 
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, isSelected && styles.selectedText]}>
                  {item.name}
                </Text>
                <Text style={[styles.cardSubtitle, isSelected && styles.selectedText]}>
                  {item.brand || 'Generic'} • {item.serving?.size}{item.serving?.unit}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              )}
            </View>
            
            <View style={styles.nutritionStats}>
              <View style={styles.nutritionStat}>
                <Text style={[styles.statValue, isSelected && styles.selectedText]}>
                  {item.nutrition?.calories || 0}
                </Text>
                <Text style={[styles.statLabel, isSelected && styles.selectedText]}>
                  cal
                </Text>
              </View>
              <View style={styles.nutritionStat}>
                <Text style={[styles.statValue, isSelected && styles.selectedText]}>
                  {item.nutrition?.protein || 0}g
                </Text>
                <Text style={[styles.statLabel, isSelected && styles.selectedText]}>
                  protein
                </Text>
              </View>
              <View style={styles.nutritionStat}>
                <Text style={[styles.statValue, isSelected && styles.selectedText]}>
                  {item.nutrition?.carbs || 0}g
                </Text>
                <Text style={[styles.statLabel, isSelected && styles.selectedText]}>
                  carbs
                </Text>
              </View>
              <View style={styles.nutritionStat}>
                <Text style={[styles.statValue, isSelected && styles.selectedText]}>
                  {item.nutrition?.fat || 0}g
                </Text>
                <Text style={[styles.statLabel, isSelected && styles.selectedText]}>
                  fat
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  };
  
  // Get filtered results based on active tab
  const getFilteredResults = () => {
    switch (activeTab) {
      case 'exercises':
        return searchResults.exercises;
      case 'nutrition':
        return searchResults.nutrition;
      default:
        return [
          ...searchResults.exercises.map(e => ({ ...e, type: 'exercise' })),
          ...searchResults.nutrition.map(n => ({ ...n, type: 'nutrition' }))
        ];
    }
  };
  
  const filteredResults = getFilteredResults();
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a1a']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Smart Search</Text>
          
          {selectedItems.length > 0 && (
            <TouchableOpacity 
              onPress={addToContext}
              style={styles.addButton}
            >
              <LinearGradient
                colors={['#FF6B35', '#FF8F65']}
                style={styles.addButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.addButtonText}>
                  Add {selectedItems.length}
                </Text>
                <Ionicons name="add-circle" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search Input with NLU Indicator */}
        <Animated.View 
          style={[
            styles.searchContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Try: 'chest exercises' or 'protein for breakfast' or 'pre-workout meal'"
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              multiline={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* NLU Understanding Indicator */}
          {parsedQuery && (
            <View style={styles.nluIndicator}>
              <View style={styles.nluBadge}>
                <Ionicons 
                  name="sparkles" 
                  size={14} 
                  color="#FFB86B" 
                />
                <Text style={styles.nluText}>
                  Understanding: {parsedQuery.type === 'mixed' ? 'Exercise + Nutrition' : 
                                parsedQuery.type === 'exercise' ? 'Exercise Search' : 'Nutrition Search'}
                </Text>
              </View>
              {parsedQuery.muscleGroups.length > 0 && (
                <Text style={styles.nluDetail}>
                  Targeting: {parsedQuery.muscleGroups.join(', ')}
                </Text>
              )}
            </View>
          )}
        </Animated.View>
        
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          {['all', 'exercises', 'nutrition'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'all' ? 'All Results' : 
                 tab === 'exercises' ? `Exercises (${searchResults.exercises.length})` :
                 `Nutrition (${searchResults.nutrition.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Results */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Searching intelligently...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredResults}
            keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
            renderItem={({ item }) => 
              item.type === 'exercise' ? renderExerciseCard({ item }) :
              item.type === 'nutrition' ? renderNutritionCard({ item }) :
              item.type ? (item.type === 'exercise' ? renderExerciseCard({ item }) : renderNutritionCard({ item })) :
              null
            }
            contentContainerStyle={styles.resultsContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              searchQuery.length > 0 && !isLoading ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={60} color="#666" />
                  <Text style={styles.emptyText}>No results found</Text>
                  <Text style={styles.emptySubtext}>Try different keywords or phrases</Text>
                </View>
              ) : null
            }
          />
        )}
        
        {/* Smart Suggestions */}
        {searchResults.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {searchResults.suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionCard}
                onPress={() => {
                  if (suggestion.action === 'createMealPlan') {
                    navigation.navigate('Generator', {
                      prompt: 'Create a meal plan for my workout routine'
                    });
                  }
                }}
              >
                <Ionicons 
                  name={suggestion.type === 'tip' ? 'bulb' : 'arrow-forward-circle'} 
                  size={20} 
                  color="#FFB86B" 
                />
                <Text style={styles.suggestionText}>{suggestion.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10,
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    gap: 5,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 5,
  },
  nluIndicator: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  nluBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 107, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  nluText: {
    color: '#FFB86B',
    fontSize: 12,
    fontWeight: '500',
  },
  nluDetail: {
    color: '#888',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFF',
  },
  resultsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  resultCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedCard: {
    transform: [{ scale: 0.98 }],
  },
  cardGradient: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  selectedText: {
    color: '#FFF',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tagText: {
    color: '#FF6B35',
    fontSize: 11,
    fontWeight: '500',
  },
  selectedTagText: {
    color: '#FFF',
  },
  nutritionStats: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-around',
  },
  nutritionStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#888',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 5,
  },
  suggestionsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 8,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 107, 0.1)',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  suggestionText: {
    flex: 1,
    color: '#FFB86B',
    fontSize: 14,
  },
});