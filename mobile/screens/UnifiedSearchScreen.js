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
import { GlassContainer, GlassCard } from '../components/GlassmorphismComponents';
import { GlassSearchInput } from '../components/GlassSearchInput';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchContext } from '../contexts/SearchContext';
import contextAggregator from '../services/contextAggregator';
import sessionContextManager from '../services/sessionContextManager';

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
  const { theme, isDarkMode } = useTheme();
  const { 
    addToHistory, 
    addExercise, 
    addFood, 
    selectedExercises, 
    selectedFoods,
    getAIChatContext 
  } = useSearchContext();
  const { fromChat = false, chatContext = null, exercisesOnly = false } = route?.params || {};
  
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
  const [sessionSummary, setSessionSummary] = useState(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Load animation and initialize session manager
  useEffect(() => {
    initializeScreen();
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

  const initializeScreen = async () => {
    try {
      await sessionContextManager.initialize();
      await sessionContextManager.trackScreenVisit('Search');
      const summary = await sessionContextManager.getSummary();
      setSessionSummary(summary);
    } catch (error) {
      console.error('Error initializing search screen:', error);
    }
  };
  
  // Simplified and more reliable search handler
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults({ exercises: [], nutrition: [], suggestions: [] });
      return;
    }
    
    setIsLoading(true);
    console.log(`🔍 Starting unified search for: "${query}"`);
    
    try {
      const results = { exercises: [], nutrition: [], suggestions: [] };
      
      // Parse query for context (but don't let it interfere with basic search)
      const parsed = parseUserQuery(query);
      setParsedQuery(parsed);
      
      // Always search nutrition for unified results
      try {
        console.log(`🥗 Searching nutrition for: "${query}"`);
        const nutritionSearchResult = await NutritionService.searchFoods(query);
        console.log(`🥗 Nutrition search raw result:`, {
          hasData: !!nutritionSearchResult,
          hasFoods: !!nutritionSearchResult?.foods,
          foodsLength: nutritionSearchResult?.foods?.length || 0,
          totalHits: nutritionSearchResult?.totalHits || 0,
          source: nutritionSearchResult?.source || 'unknown',
          firstFood: nutritionSearchResult?.foods?.[0] ? {
            fdcId: nutritionSearchResult.foods[0].fdcId,
            description: nutritionSearchResult.foods[0].description,
            calories: nutritionSearchResult.foods[0].calories
          } : null
        });
        
        if (nutritionSearchResult && nutritionSearchResult.foods && nutritionSearchResult.foods.length > 0) {
          // Transform nutrition results to ensure consistent structure
          const transformedNutrition = nutritionSearchResult.foods.map(food => {
            const transformed = {
              id: food.fdcId || food.id || Math.random().toString(36).substr(2, 9),
              name: food.description || food.name || 'Unknown Food',
              brand: food.brandOwner || food.brandName || food.brand || 'USDA Database',
              category: food.category || 'Food',
              serving: food.serving || { 
                size: food.servingSize || 100, 
                unit: food.servingSizeUnit || 'g' 
              },
              // Flatten nutrition data for easier access
              calories: food.calories?.value || food.nutrition?.calories || 0,
              protein: food.protein?.value || food.nutrition?.protein || 0,
              carbs: food.carbs?.value || food.nutrition?.carbs || 0,
              fat: food.fat?.value || food.nutrition?.fat || 0,
              // Keep original nutrition object for compatibility
              nutrition: {
                calories: food.calories?.value || food.nutrition?.calories || 0,
                protein: food.protein?.value || food.nutrition?.protein || 0,
                carbs: food.carbs?.value || food.nutrition?.carbs || 0,
                fat: food.fat?.value || food.nutrition?.fat || 0,
                fiber: food.fiber?.value || food.nutrition?.fiber || 0,
                sugar: food.sugar?.value || food.nutrition?.sugar || 0,
                sodium: food.sodium?.value || food.nutrition?.sodium || 0
              }
            };
            console.log(`🔄 Transformed nutrition item:`, {
              id: transformed.id,
              name: transformed.name,
              calories: transformed.calories,
              protein: transformed.protein
            });
            return transformed;
          });
          
          results.nutrition = transformedNutrition.slice(0, 20);
          console.log(`✅ Found ${results.nutrition.length} nutrition results from ${nutritionSearchResult.source}`);
        } else {
          console.log('⚠️ No nutrition results from search');
          results.nutrition = [];
        }
      } catch (error) {
        console.error('❌ Nutrition search failed:', error.message);
        console.error('Full error:', error);
        results.nutrition = [];
      }
      
      // Search exercises SECOND 
      try {
        console.log(`💪 Searching exercises for: "${query}"`);
        const exerciseSearchResult = await searchService.searchExercises({
          query: query.trim(),
          categories: [],
          equipment: [],
          muscles: parsed.muscleGroups || [],
          difficulty: [],
          limit: 50
        });
        
        if (exerciseSearchResult && exerciseSearchResult.exercises) {
          // Apply simple case-insensitive filtering
          const queryLower = query.toLowerCase().trim();
          const exerciseResults = exerciseSearchResult.exercises.filter(ex => {
            return ex.name?.toLowerCase().includes(queryLower) ||
                   ex.category?.toLowerCase().includes(queryLower) ||
                   ex.description?.toLowerCase().includes(queryLower) ||
                   (ex.primary_muscles?.some(m => m.toLowerCase().includes(queryLower))) ||
                   (ex.secondary_muscles?.some(m => m.toLowerCase().includes(queryLower))) ||
                   (Array.isArray(ex.equipment) 
                     ? ex.equipment.some(e => e.toLowerCase().includes(queryLower))
                     : ex.equipment?.toLowerCase().includes(queryLower));
          });
          
          results.exercises = exerciseResults.slice(0, 20);
          console.log(`✅ Found ${results.exercises.length} exercise results`);
        }
      } catch (error) {
        console.error('❌ Exercise search failed:', error);
        results.exercises = [];
      }
      
      // Generate smart suggestions based on results
      const nutritionCount = results.nutrition.length;
      const exerciseCount = results.exercises.length;
      
      if (nutritionCount > 0) {
        results.suggestions = [
          { type: 'tip', text: '🥗 Pre-workout: Focus on carbs for energy' },
          { type: 'tip', text: '🥩 Post-workout: Prioritize protein for recovery' },
          { type: 'action', text: '📱 Create a personalized meal plan', action: 'createMealPlan' }
        ];
        parsed.type = exerciseCount > 0 ? 'mixed' : 'nutrition';
      } else if (exerciseCount > 0) {
        results.suggestions = [
          { type: 'tip', text: '💪 Warm up before intense exercises' },
          { type: 'tip', text: '⏱️ Rest 60-90 seconds between sets' },
          { type: 'action', text: '🎯 Generate a workout plan', action: 'createWorkout' }
        ];
        parsed.type = 'exercise';
      }
      
      console.log(`🎯 Search completed: ${exerciseCount} exercises, ${nutritionCount} nutrition items`);
      
      setSearchResults(results);
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults({ exercises: [], nutrition: [], suggestions: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Debounced search - reduced to 300ms for better responsiveness
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Add to session context and navigate to generator
  const addToContext = useCallback(async () => {
    if (selectedItems.length === 0) return;
    
    // Add selected items to the session context
    const exercises = selectedItems.filter(item => item.type === 'exercise');
    const foods = selectedItems.filter(item => item.type === 'nutrition');
    
    try {
      // Add to session context manager
      if (exercises.length > 0) {
        await sessionContextManager.addExercises(exercises, 'search');
      }
      
      if (foods.length > 0) {
        await sessionContextManager.addNutrition(foods, 'search');
      }
      
      // Also add to legacy search context for compatibility
      exercises.forEach(ex => addExercise(ex));
      foods.forEach(food => addFood(food));
      
      // Store context in aggregator for persistence
      await contextAggregator.storeExerciseContext(exercises, foods, {
        query: searchQuery,
        parsedIntent: parsedQuery
      });
      
      // Get comprehensive context for AI chat
      const aiContext = await sessionContextManager.getAIChatContext();
      
      // Build initial message for AI chat
      let initialMessage = '';
      if (exercises.length > 0 && foods.length > 0) {
        initialMessage = `I've selected ${exercises.length} exercises and ${foods.length} nutrition items. Please create a comprehensive workout and nutrition plan using these selections.`;
      } else if (exercises.length > 0) {
        const exerciseNames = exercises.slice(0, 3).map(e => e.name).join(', ');
        const moreText = exercises.length > 3 ? ` and ${exercises.length - 3} more` : '';
        initialMessage = `I've selected these exercises: ${exerciseNames}${moreText}. Please create a workout plan incorporating these exercises.`;
      } else if (foods.length > 0) {
        initialMessage = `I've selected ${foods.length} nutrition items. Please help me create a meal plan with these foods.`;
      }
      
      // Add context to the initial message
      if (aiContext.contextText) {
        initialMessage += `\n\nAdditional context:${aiContext.contextText}`;
      }
      
      console.log('🎯 Navigating to ContextAwareGenerator with session context');
      
      // Navigate directly to ContextAwareGenerator with the comprehensive context
      navigation.navigate('ContextAwareGenerator', {
        searchContext: {
          exercises: exercises,
          foods: foods,
          query: searchQuery,
          parsedIntent: parsedQuery,
          timestamp: Date.now()
        },
        sessionContext: aiContext.fullContext,
        selectedExercises: exercises,
        selectedFoods: foods,
        initialMessage: initialMessage,
        skipContextModal: true, // Flag to skip showing the context modal
        directFromSearch: true
      });
      
    } catch (error) {
      console.error('Failed to add items to session context:', error);
      // Fall back to original navigation
      navigation.navigate('ContextAwareGenerator', {
        searchContext: {
          exercises: exercises,
          foods: foods,
          query: searchQuery,
          parsedIntent: parsedQuery,
          timestamp: Date.now()
        },
        selectedExercises: exercises,
        selectedFoods: foods,
        skipContextModal: true,
        directFromSearch: true
      });
    }
  }, [selectedItems, searchQuery, parsedQuery, navigation, addExercise, addFood]);
  
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
  
  // Render exercise card with emoji indicator
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
            colors={isSelected ? ['#FF6B35', '#FF8F65'] : (isDarkMode ? ['#1a1a1a', '#2a2a2a'] : ['#f5f5f5', '#ffffff'])}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, styles.exerciseIcon]}>
                <Text style={[styles.emojiIcon, { fontSize: 24 }]}>💪</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: isSelected ? '#FFF' : theme.theme.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.cardSubtitle, { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.theme.textSecondary }]} numberOfLines={1}>
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
  
  // Render nutrition card with emoji indicator
  const renderNutritionCard = ({ item }) => {
    const isSelected = selectedItems.some(
      selected => selected.id === item.id && selected.type === 'nutrition'
    );
    
    // Get appropriate food emoji based on category or name
    const getFoodEmoji = (food) => {
      const name = food.name?.toLowerCase() || '';
      const category = food.category?.toLowerCase() || '';
      
      if (name.includes('apple')) return '🍎';
      if (name.includes('banana')) return '🍌';
      if (name.includes('avocado')) return '🥑';
      if (name.includes('chicken')) return '🍗';
      if (name.includes('beef') || name.includes('steak')) return '🥩';
      if (name.includes('fish') || name.includes('salmon')) return '🐟';
      if (name.includes('egg')) return '🥚';
      if (name.includes('bread')) return '🍞';
      if (name.includes('rice')) return '🍚';
      if (name.includes('pasta')) return '🍝';
      if (name.includes('milk') || category.includes('dairy')) return '🥛';
      if (name.includes('cheese')) return '🧀';
      if (name.includes('vegetable') || name.includes('salad')) return '🥗';
      if (category.includes('fruit')) return '🍓';
      if (category.includes('protein')) return '🥩';
      return '🍽️'; // Default food emoji
    };
    
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
            colors={isSelected ? ['#4CAF50', '#66BB6A'] : (isDarkMode ? ['#1a1a1a', '#2a2a2a'] : ['#f5f5f5', '#ffffff'])}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, styles.nutritionIcon]}>
                <Text style={[styles.emojiIcon, { fontSize: 24 }]}>{getFoodEmoji(item)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: isSelected ? '#FFF' : theme.theme.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.cardSubtitle, { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.theme.textSecondary }]} numberOfLines={1}>
                  {item.brand || 'USDA Database'} • {item.serving?.size || '100'}{item.serving?.unit || 'g'}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              )}
            </View>
            
            <View style={styles.nutritionStats}>
              <View style={styles.nutritionStat}>
                <Text style={[styles.statValue, { color: isSelected ? '#FFF' : theme.theme.text }]}>
                  {item.calories || item.nutrition?.calories || 0}
                </Text>
                <Text style={[styles.statLabel, { color: isSelected ? 'rgba(255,255,255,0.7)' : theme.theme.textSecondary }]}>
                  cal
                </Text>
              </View>
              <View style={styles.nutritionStat}>
                <Text style={[styles.statValue, { color: isSelected ? '#FFF' : theme.theme.text }]}>
                  {item.protein || item.nutrition?.protein || 0}g
                </Text>
                <Text style={[styles.statLabel, { color: isSelected ? 'rgba(255,255,255,0.7)' : theme.theme.textSecondary }]}>
                  protein
                </Text>
              </View>
              <View style={styles.nutritionStat}>
                <Text style={[styles.statValue, { color: isSelected ? '#FFF' : theme.theme.text }]}>
                  {item.carbs || item.nutrition?.carbs || 0}g
                </Text>
                <Text style={[styles.statLabel, { color: isSelected ? 'rgba(255,255,255,0.7)' : theme.theme.textSecondary }]}>
                  carbs
                </Text>
              </View>
              <View style={styles.nutritionStat}>
                <Text style={[styles.statValue, { color: isSelected ? '#FFF' : theme.theme.text }]}>
                  {item.fat || item.nutrition?.fat || 0}g
                </Text>
                <Text style={[styles.statLabel, { color: isSelected ? 'rgba(255,255,255,0.7)' : theme.theme.textSecondary }]}>
                  fat
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  };
  
  // Split column view for exercises and nutrition
  const renderSplitResults = () => {
    const exercises = searchResults.exercises || [];
    const nutrition = searchResults.nutrition || [];
    
    // If exercises only mode, use full width for exercises
    if (exercisesOnly) {
      return (
        <View style={styles.fullWidthContainer}>
          <View style={styles.columnHeader}>
            <Text style={[styles.columnTitle, { color: theme.theme.text }]}>💪 {exercises.length} Exercise Results</Text>
          </View>
          <FlatList
            data={exercises}
            keyExtractor={(item, index) => `exercise-${item.id}-${index}`}
            renderItem={renderExerciseCard}
            contentContainerStyle={styles.columnContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !isLoading && searchQuery.length > 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="barbell-outline" size={60} color={theme.theme.textTertiary} />
                  <Text style={[styles.emptyText, { color: theme.theme.text }]}>No exercises found</Text>
                  <Text style={[styles.emptySubtext, { color: theme.theme.textSecondary }]}>Try different search terms</Text>
                </View>
              ) : null
            }
          />
        </View>
      );
    }
    
    // Normal split view for unified search
    return (
      <View style={styles.splitContainer}>
        {/* Exercises Column */}
        <View style={styles.splitColumn}>
          <View style={styles.columnHeader}>
            <Text style={[styles.columnTitle, { color: theme.theme.text }]}>💪 Exercises</Text>
            <Text style={[styles.columnCount, { color: theme.theme.textSecondary }]}>{exercises.length} results</Text>
          </View>
          <FlatList
            data={exercises}
            keyExtractor={(item, index) => `exercise-${item.id}-${index}`}
            renderItem={renderExerciseCard}
            contentContainerStyle={styles.columnContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !isLoading && searchQuery.length > 0 ? (
                <View style={styles.emptyColumn}>
                  <Text style={[styles.emptyColumnText, { color: theme.theme.textSecondary }]}>No exercises found</Text>
                </View>
              ) : null
            }
          />
        </View>
        
        {/* Divider */}
        <View style={styles.columnDivider} />
        
        {/* Nutrition Column */}
        <View style={styles.splitColumn}>
          <View style={styles.columnHeader}>
            <Text style={[styles.columnTitle, { color: theme.theme.text }]}>🍽️ Nutrition</Text>
            <Text style={[styles.columnCount, { color: theme.theme.textSecondary }]}>{nutrition.length} results</Text>
          </View>
          <FlatList
            data={nutrition}
            keyExtractor={(item, index) => `nutrition-${item.id}-${index}`}
            renderItem={renderNutritionCard}
            contentContainerStyle={styles.columnContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !isLoading && searchQuery.length > 0 ? (
                <View style={styles.emptyColumn}>
                  <Text style={[styles.emptyColumnText, { color: theme.theme.textSecondary }]}>No foods found</Text>
                </View>
              ) : null
            }
          />
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#000000', '#0A0A0A', '#141414'] : ['#FFFFFF', '#F8F9FA', '#F0F1F3']}
        style={styles.gradient}
      >
        {/* Enhanced Header with Info */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.theme.text} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.theme.text }]}>{exercisesOnly ? 'Exercise Library' : 'Intelligent Search'}</Text>
            <View style={styles.headerSubtitleContainer}>
              <Text style={[styles.headerSubtitle, { color: theme.theme.textSecondary }]}>Find exercises & nutrition info</Text>
              {sessionSummary && sessionSummary.completionPercentage > 0 && (
                <View style={styles.contextIndicator}>
                  <Ionicons name="layers" size={12} color="#4CAF50" />
                  <Text style={styles.contextIndicatorText}>
                    {sessionSummary.completionPercentage}% context
                  </Text>
                </View>
              )}
            </View>
          </View>
          
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
        
        {/* Search Input positioned under header */}
        <Animated.View 
          style={[
            styles.searchContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <GlassSearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={exercisesOnly ? "Search 872+ exercises..." : "Try: 'chest exercises' or 'protein for breakfast'"}
            autoFocus={!exercisesOnly}
          />
          
          {/* Informational Card - Show when no search */}
          {!searchQuery && (
            <GlassCard variant="subtle" style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <View style={[styles.infoIconContainer, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(76, 175, 80, 0.35)' }]}>
                  <Ionicons name="sparkles" size={24} color={isDarkMode ? '#A7F3D0' : '#4CAF50'} />
                </View>
                <Text style={[styles.infoTitle, { color: theme.theme.text }]}>What can you search?</Text>
              </View>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <View style={[styles.infoItemIcon, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                    <Ionicons name="fitness" size={16} color="#4CAF50" />
                  </View>
                  <Text style={[styles.infoItemText, { color: theme.theme.textSecondary }]}>"Chest exercises" - Find targeted workouts</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <View style={[styles.infoItemIcon, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
                    <Ionicons name="restaurant" size={16} color="#2196F3" />
                  </View>
                  <Text style={[styles.infoItemText, { color: theme.theme.textSecondary }]}>"Protein for breakfast" - Get nutrition info</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <View style={[styles.infoItemIcon, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
                    <Ionicons name="body" size={16} color="#FF9800" />
                  </View>
                  <Text style={[styles.infoItemText, { color: theme.theme.textSecondary }]}>"Upper body workout" - Build routines</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <View style={[styles.infoItemIcon, { backgroundColor: 'rgba(233, 30, 99, 0.15)' }]}>
                    <Ionicons name="nutrition" size={16} color="#E91E63" />
                  </View>
                  <Text style={[styles.infoItemText, { color: theme.theme.textSecondary }]}>"Calories in chicken" - Track macros</Text>
                </View>
              </View>
              
              <Text style={[styles.infoTip, { color: theme.theme.textTertiary }]}>
                💡 Tip: Use natural language like "how to build stronger legs"
              </Text>
            </GlassCard>
          )}
          
          {/* NLU Understanding Indicator with emojis */}
          {parsedQuery && searchQuery && (
            <View style={styles.nluIndicator}>
              <View style={styles.nluBadge}>
                <Ionicons 
                  name="sparkles" 
                  size={14} 
                  color="#FFB86B" 
                />
                <Text style={styles.nluText}>
                  {parsedQuery.type === 'mixed' ? '💪 Exercise + 🍽️ Nutrition' : 
                   parsedQuery.type === 'exercise' ? '💪 Exercise Search' : 
                   parsedQuery.type === 'nutrition' ? '🍽️ Nutrition Search' : 'Searching...'}
                </Text>
              </View>
              {parsedQuery.muscleGroups.length > 0 && (
                <Text style={styles.nluDetail}>
                  🎯 Targeting: {parsedQuery.muscleGroups.join(', ')}
                </Text>
              )}
              {parsedQuery.foodCategories.length > 0 && (
                <Text style={styles.nluDetail}>
                  🥗 Food type: {parsedQuery.foodCategories.join(', ')}
                </Text>
              )}
            </View>
          )}
        </Animated.View>
        
        {/* Result Count Summary */}
        {(searchResults.exercises.length > 0 || searchResults.nutrition.length > 0) && (
          <View style={styles.resultSummary}>
            <Text style={[styles.resultSummaryText, { color: theme.theme.textSecondary }]}>
              Found {searchResults.exercises.length + searchResults.nutrition.length} results for "{searchQuery}"
            </Text>
          </View>
        )}
        
        {/* Results - Split View or Loading */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={[styles.loadingText, { color: theme.theme.textSecondary }]}>Searching intelligently...</Text>
          </View>
        ) : searchQuery.length > 0 && searchResults.exercises.length === 0 && searchResults.nutrition.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={60} color={theme.theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.theme.text }]}>No results found</Text>
            <Text style={[styles.emptySubtext, { color: theme.theme.textSecondary }]}>Try different keywords or phrases</Text>
          </View>
        ) : searchQuery.length > 0 ? (
          renderSplitResults()
        ) : null}
        
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
  headerContent: {
    flex: 1,
    marginLeft: 10,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  },
  headerSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  contextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  contextIndicatorText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
    padding: 20,
    borderRadius: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoItemText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  infoTip: {
    fontSize: 12,
    marginTop: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emojiIcon: {
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
  },
  exerciseIcon: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  nutritionIcon: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
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
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
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
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  fullWidthContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  splitColumn: {
    flex: 1,
    paddingHorizontal: 5,
  },
  columnDivider: {
    width: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 10,
  },
  columnHeader: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    marginBottom: 10,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  },
  columnCount: {
    fontSize: 12,
    color: '#888',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  },
  columnContent: {
    paddingBottom: 20,
  },
  emptyColumn: {
    padding: 20,
    alignItems: 'center',
  },
  emptyColumnText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  },
  resultSummary: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  resultSummaryText: {
    fontSize: 13,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  },
  resultCard: {
    marginBottom: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  selectedCard: {
    transform: [{ scale: 0.98 }],
  },
  cardGradient: {
    padding: 12,
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
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 3,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#888',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
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
    marginTop: 8,
    justifyContent: 'space-around',
  },
  nutritionStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  },
  statLabel: {
    fontSize: 9,
    color: '#888',
    marginTop: 1,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
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