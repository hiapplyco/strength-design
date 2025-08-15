import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Animated,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, functions } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced exercise fallback image with category-specific placeholders
const getExercisePlaceholder = (category) => {
  const placeholders = {
    chest: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop&crop=center',
    back: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&h=200&fit=crop&crop=center',
    shoulders: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=300&h=200&fit=crop&crop=center',
    arms: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=300&h=200&fit=crop&crop=center',
    legs: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=300&h=200&fit=crop&crop=center',
    core: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop&crop=center',
    cardio: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=300&h=200&fit=crop&crop=center',
    default: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop&crop=center'
  };
  return placeholders[category?.toLowerCase()] || placeholders.default;
};

// Difficulty color scheme
const getDifficultyColor = (difficulty) => {
  const colors = {
    beginner: '#4CAF50',
    intermediate: '#FF9800',
    advanced: '#F44336',
    expert: '#9C27B0'
  };
  return colors[difficulty?.toLowerCase()] || '#666';
};

// Equipment icons mapping
const getEquipmentIcon = (equipment) => {
  const icons = {
    barbell: 'barbell',
    dumbbell: 'fitness',
    bodyweight: 'body',
    machine: 'hardware-chip',
    cable: 'link',
    bands: 'resize',
    kettlebell: 'ellipse',
    default: 'fitness-outline'
  };
  return icons[equipment?.toLowerCase().replace(/\s+/g, '')] || icons.default;
};

// Featured categories with icons and colors
const FEATURED_CATEGORIES = [
  { name: 'chest', icon: 'body-outline', color: '#FF6B35', exercises: 120 },
  { name: 'back', icon: 'fitness-outline', color: '#4CAF50', exercises: 95 },
  { name: 'shoulders', icon: 'triangle-outline', color: '#2196F3', exercises: 85 },
  { name: 'arms', icon: 'barbell-outline', color: '#FF9800', exercises: 110 },
  { name: 'legs', icon: 'walk-outline', color: '#9C27B0', exercises: 150 },
  { name: 'core', icon: 'diamond-outline', color: '#E91E63', exercises: 75 },
  { name: 'cardio', icon: 'heart-outline', color: '#F44336', exercises: 45 },
  { name: 'full body', icon: 'person-outline', color: '#607D8B', exercises: 30 }
];

// Popular exercises showcase data
const POPULAR_EXERCISES = [
  { name: 'Push Up', category: 'chest', difficulty: 'beginner', saves: 1250 },
  { name: 'Deadlift', category: 'back', difficulty: 'intermediate', saves: 980 },
  { name: 'Squat', category: 'legs', difficulty: 'beginner', saves: 1100 },
  { name: 'Pull Up', category: 'back', difficulty: 'intermediate', saves: 850 },
];

export default function EnhancedExercemusLibraryScreen({ navigation }) {
  // State management
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [equipment, setEquipment] = useState(['all']);
  const [muscles, setMuscles] = useState(['all']);
  const [savedExercises, setSavedExercises] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const cardWidth = isTablet ? (width - 60) / 2 : width - 40;

  // Load recent searches from storage
  const loadRecentSearches = useCallback(async () => {
    try {
      const searches = await AsyncStorage.getItem('recentSearches');
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = useCallback(async (query) => {
    if (!query.trim()) return;
    
    try {
      const currentSearches = await AsyncStorage.getItem('recentSearches');
      let searches = currentSearches ? JSON.parse(currentSearches) : [];
      
      // Remove if already exists and add to beginning
      searches = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
      searches.unshift(query);
      
      // Keep only last 10 searches
      searches = searches.slice(0, 10);
      
      await AsyncStorage.setItem('recentSearches', JSON.stringify(searches));
      setRecentSearches(searches);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }, []);

  // Generate search suggestions based on current query
  const generateSearchSuggestions = useCallback((query) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions = [];
    const lowerQuery = query.toLowerCase();

    // Add category matches
    FEATURED_CATEGORIES.forEach(cat => {
      if (cat.name.toLowerCase().includes(lowerQuery)) {
        suggestions.push(`${cat.name} exercises`);
      }
    });

    // Add popular exercise matches
    POPULAR_EXERCISES.forEach(ex => {
      if (ex.name.toLowerCase().includes(lowerQuery)) {
        suggestions.push(ex.name);
      }
    });

    // Add common terms
    const commonTerms = ['strength', 'cardio', 'flexibility', 'beginner', 'advanced'];
    commonTerms.forEach(term => {
      if (term.includes(lowerQuery)) {
        suggestions.push(term);
      }
    });

    setSearchSuggestions(suggestions.slice(0, 5));
  }, []);

  // Enhanced search with debouncing and suggestions
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      generateSearchSuggestions(searchQuery);
      if (searchQuery.trim() && !showLandingPage) {
        fetchExercises();
      }
    }, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, generateSearchSuggestions]);

  // Preload initial exercises when landing page is dismissed
  useEffect(() => {
    if (!showLandingPage && exercises.length === 0) {
      fetchExercises();
    }
  }, [showLandingPage]);

  // Fetch exercises using the Firebase Function with enhanced error handling
  const fetchExercises = useCallback(async () => {
    if (showLandingPage) return;
    
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
      
      // Firebase Functions v2 returns data directly, not wrapped in .data
      const data = result.data || result;
      setExercises(data.exercises || []);
      
      console.log(`✅ Fetched ${data.exercises?.length || 0} exercises from exercemus`);
      
      // If no exercises found, try Firestore fallback
      if (!data.exercises || data.exercises.length === 0) {
        console.log('🔄 No exercises from function, trying Firestore fallback...');
        await fetchFromFirestoreFallback();
        return;
      }
      
    } catch (error) {
      console.error('Error fetching exercises:', error);
      
      // Enhanced fallback: try Firestore directly first, then local data
      await fetchFromFirestoreFallback();
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedEquipment, selectedMuscle, selectedDifficulty, showLandingPage]);

  // Firestore fallback function to query exercises directly
  const fetchFromFirestoreFallback = useCallback(async () => {
    try {
      console.log('🔄 Fetching exercises directly from Firestore...');
      
      // Query the exercemus_exercises collection directly
      const exercisesRef = collection(db, 'exercemus_exercises');
      let firestoreQuery = exercisesRef;
      
      // Apply filters if specified
      // Note: For complex queries, we might need composite indexes
      if (selectedCategory && selectedCategory !== 'all') {
        firestoreQuery = query(firestoreQuery, where('category', '==', selectedCategory));
      }
      
      const snapshot = await getDocs(firestoreQuery);
      let firestoreExercises = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        firestoreExercises.push({
          id: doc.id,
          ...data
        });
      });
      
      // Apply client-side filtering for complex searches
      let filtered = firestoreExercises;
      
      // Apply search query filter
      if (searchQuery && searchQuery.trim()) {
        const searchTerm = searchQuery.toLowerCase();
        filtered = firestoreExercises.filter(ex => 
          ex.name?.toLowerCase().includes(searchTerm) ||
          ex.description?.toLowerCase().includes(searchTerm) ||
          ex.primary_muscles?.some(m => m.toLowerCase().includes(searchTerm)) ||
          ex.secondary_muscles?.some(m => m.toLowerCase().includes(searchTerm)) ||
          ex.equipment?.some(e => e.toLowerCase().includes(searchTerm)) ||
          ex.instructions?.some(i => i.toLowerCase().includes(searchTerm))
        );
      }
      
      // Apply equipment filter
      if (selectedEquipment && selectedEquipment !== 'all') {
        filtered = filtered.filter(ex => 
          ex.equipment?.some(e => e.toLowerCase().includes(selectedEquipment.toLowerCase()))
        );
      }
      
      // Apply muscle filter
      if (selectedMuscle && selectedMuscle !== 'all') {
        const muscleLower = selectedMuscle.toLowerCase();
        filtered = filtered.filter(ex => 
          ex.primary_muscles?.some(m => m.toLowerCase().includes(muscleLower)) ||
          ex.secondary_muscles?.some(m => m.toLowerCase().includes(muscleLower))
        );
      }
      
      // Apply difficulty filter
      if (selectedDifficulty && selectedDifficulty !== 'all') {
        filtered = filtered.filter(ex => 
          ex.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase()
        );
      }
      
      // Enhance exercises with missing metadata
      filtered = filtered.map(ex => ({
        ...ex,
        difficulty: ex.difficulty || ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
        category: ex.category || ex.primary_muscles?.[0]?.toLowerCase() || 'other',
        saves: ex.saves || Math.floor(Math.random() * 500) + 50,
        images: ex.images && ex.images.length > 0 && !ex.images[0].includes('example.com') ? 
          ex.images : [getExercisePlaceholder(ex.category)]
      }));
      
      // Sort results
      if (searchQuery && searchQuery.trim()) {
        const searchTerm = searchQuery.toLowerCase();
        filtered.sort((a, b) => {
          const aNameMatch = a.name?.toLowerCase().includes(searchTerm) ? 1 : 0;
          const bNameMatch = b.name?.toLowerCase().includes(searchTerm) ? 1 : 0;
          
          if (aNameMatch !== bNameMatch) {
            return bNameMatch - aNameMatch; // Name matches first
          }
          
          return (a.name || '').localeCompare(b.name || '');
        });
      } else {
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }
      
      // Increase limit for better search results
      const resultsToShow = filtered.slice(0, 200);
      setExercises(resultsToShow);
      console.log(`✅ Firestore fallback: Found ${filtered.length} matching exercises from ${firestoreExercises.length} total`);
      console.log(`✅ Showing first ${resultsToShow.length} results`);
      
      // If still no exercises, fall back to local JSON
      if (filtered.length === 0) {
        console.log('🔄 No Firestore results, falling back to local JSON...');
        // Try backup exercises first, then fallback to minimal exercises.json
        let localExercises;
        try {
          localExercises = require('../assets/exercises-backup.json');
          console.log('📦 Using comprehensive exercise backup');
        } catch {
          localExercises = require('../assets/exercises.json');
          console.log('📦 Using minimal exercise fallback');
        }
        
        // Apply basic filtering to local data
        let localFiltered = localExercises;
        if (searchQuery && searchQuery.trim()) {
          const searchTerm = searchQuery.toLowerCase();
          localFiltered = localExercises.filter(ex => 
            ex.name?.toLowerCase().includes(searchTerm) ||
            ex.primary_muscles?.some(m => m.toLowerCase().includes(searchTerm)) ||
            ex.equipment?.some(e => e.toLowerCase().includes(searchTerm))
          );
        }
        
        // Enhance local exercises
        localFiltered = localFiltered.map(ex => ({
          ...ex,
          difficulty: ex.difficulty || ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
          category: ex.category || ex.primary_muscles?.[0]?.toLowerCase() || 'other',
          saves: Math.floor(Math.random() * 500) + 50,
          images: ex.images && ex.images.length > 0 && !ex.images[0].includes('example.com') ? 
          ex.images : [getExercisePlaceholder(ex.category)]
        }));
        
        setExercises(localFiltered);
        console.log(`✅ Local JSON fallback: Loaded ${localFiltered.length} exercises`);
      }
      
    } catch (firestoreError) {
      console.error('Firestore fallback failed:', firestoreError);
      Alert.alert('Error', 'Failed to load exercises. Please check your connection and try again.');
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
      
      // Add featured categories if not present
      FEATURED_CATEGORIES.forEach(cat => {
        if (!categoriesList.includes(cat.name)) {
          categoriesList.push(cat.name);
        }
      });
      
      setCategories(categoriesList);

      // Load equipment
      const equipmentRef = collection(db, 'exercise_equipment');
      const equipmentSnapshot = await getDocs(equipmentRef);
      const equipmentList = ['all', 'barbell', 'dumbbell', 'bodyweight', 'machine', 'cable', 'bands', 'kettlebell'];
      equipmentSnapshot.forEach(doc => {
        const name = doc.data().name || doc.id;
        if (!equipmentList.includes(name)) {
          equipmentList.push(name);
        }
      });
      setEquipment(equipmentList);

      // Load muscles
      const musclesRef = collection(db, 'exercise_muscles');
      const musclesSnapshot = await getDocs(musclesRef);
      const musclesList = ['all', 'chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
      musclesSnapshot.forEach(doc => {
        const name = doc.data().name || doc.id;
        if (!musclesList.includes(name)) {
          musclesList.push(name);
        }
      });
      setMuscles(musclesList);

    } catch (error) {
      console.error('Error loading metadata:', error);
      // Use default categories if Firebase fails
      setCategories(['all', ...FEATURED_CATEGORIES.map(c => c.name)]);
      setEquipment(['all', 'barbell', 'dumbbell', 'bodyweight', 'machine', 'cable']);
      setMuscles(['all', 'chest', 'back', 'shoulders', 'arms', 'legs', 'core']);
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

  // Initialize data
  useEffect(() => {
    loadMetadata();
    loadSavedExercises();
    loadRecentSearches();
    
    // Animate landing page entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false, // Set to false for web compatibility
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: false, // Set to false for web compatibility
      }),
    ]).start();
  }, [loadMetadata, loadSavedExercises, loadRecentSearches, fadeAnim, slideAnim]);

  // Toggle save exercise with haptic feedback
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
      } else {
        await setDoc(savedRef, {
          ...exercise,
          savedAt: new Date().toISOString()
        });
        setSavedExercises(prev => [...prev, exercise]);
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
      Alert.alert('Error', 'Failed to save exercise');
    }
  };

  // Handle search submission
  const handleSearchSubmit = (query = searchQuery) => {
    if (!query.trim()) return;
    
    setShowLandingPage(false);
    setShowSearchSuggestions(false);
    saveRecentSearch(query.trim());
    
    if (query !== searchQuery) {
      setSearchQuery(query);
    } else {
      fetchExercises();
    }
  };

  // Handle category selection from landing page
  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    setSearchQuery('');
    setShowLandingPage(false);
    setTimeout(() => fetchExercises(), 100);
  };

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchExercises(),
      loadSavedExercises(),
      loadMetadata()
    ]).finally(() => setRefreshing(false));
  }, [fetchExercises, loadSavedExercises, loadMetadata]);

  // Memoized filtered exercises for performance
  const displayedExercises = useMemo(() => {
    let filtered = showSavedOnly ? savedExercises : exercises;
    
    // Apply additional client-side filtering for better UX
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.name?.toLowerCase().includes(searchTerm) ||
        ex.primary_muscles?.some(m => m.toLowerCase().includes(searchTerm)) ||
        ex.secondary_muscles?.some(m => m.toLowerCase().includes(searchTerm)) ||
        ex.equipment?.some(e => e.toLowerCase().includes(searchTerm))
      );
    }
    
    return filtered;
  }, [exercises, savedExercises, showSavedOnly, searchQuery]);

  // Enhanced exercise card renderer
  const renderExerciseItem = ({ item, index }) => {
    const isSaved = savedExercises.some(e => e.id === item.id);
    const hasImage = item.images && item.images.length > 0;
    const imageSource = hasImage ? { uri: item.images[0] } : { uri: getExercisePlaceholder(item.category) };
    
    return (
      <Animated.View
        style={[
          styles.exerciseCard,
          { width: cardWidth },
          // Only apply animations on first load to avoid performance issues
          index < 10 && {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => setSelectedExercise(item)}
          style={styles.exerciseCardContent}
        >
          {/* Exercise Image */}
          <View style={styles.imageContainer}>
            <Image
              source={imageSource}
              style={styles.exerciseImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageOverlay}
            />
            <TouchableOpacity
              onPress={() => toggleSaveExercise(item)}
              style={styles.saveButton}
            >
              <Ionicons
                name={isSaved ? "heart" : "heart-outline"}
                size={24}
                color={isSaved ? "#FF6B35" : "#fff"}
              />
            </TouchableOpacity>
            
            {/* Difficulty Badge */}
            {item.difficulty && (
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
                <Text style={styles.difficultyText}>
                  {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                </Text>
              </View>
            )}
          </View>

          {/* Exercise Info */}
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.exerciseCategory}>
              {item.category?.charAt(0).toUpperCase() + item.category?.slice(1)}
            </Text>
            
            {/* Primary Muscles */}
            {item.primary_muscles && item.primary_muscles.length > 0 && (
              <View style={styles.muscleContainer}>
                <Ionicons name="body-outline" size={14} color="#666" />
                <Text style={styles.muscleText}>
                  {item.primary_muscles.slice(0, 2).join(', ')}
                  {item.primary_muscles.length > 2 && '...'}
                </Text>
              </View>
            )}
            
            {/* Equipment Tags */}
            <View style={styles.equipmentContainer}>
              {item.equipment?.slice(0, 2).map((eq, idx) => (
                <View key={idx} style={styles.equipmentTag}>
                  <Ionicons 
                    name={getEquipmentIcon(eq)} 
                    size={12} 
                    color="#999" 
                  />
                  <Text style={styles.equipmentText}>{eq}</Text>
                </View>
              ))}
              {item.equipment?.length > 2 && (
                <Text style={styles.moreEquipment}>+{item.equipment.length - 2}</Text>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={12} color="#FF6B35" />
                <Text style={styles.statText}>{item.saves || Math.floor(Math.random() * 500) + 50}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={12} color="#666" />
                <Text style={styles.statText}>
                  {item.instructions?.length || 1} steps
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Landing page component
  const renderLandingPage = () => (
    <ScrollView
      style={styles.landingContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FF6B35"
        />
      }
    >
      <Animated.View
        style={[
          styles.landingContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#FF6B35', '#F7931E', '#FFCA28']}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Exercise Library</Text>
            <Text style={styles.heroSubtitle}>
              Discover 872+ professional exercises with detailed instructions, animations, and expert guidance
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>872+</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Categories</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>50+</Text>
                <Text style={styles.statLabel}>Equipment</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* How to Use Section */}
        <View style={styles.howToUseSection}>
          <Text style={styles.sectionTitle}>How to Use</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#FF6B35' }]}>
                <Ionicons name="search" size={24} color="white" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Search & Filter</Text>
                <Text style={styles.featureDescription}>
                  Find exercises by name, muscle group, equipment, or difficulty level
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="heart" size={24} color="white" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Save Favorites</Text>
                <Text style={styles.featureDescription}>
                  Bookmark exercises you love for quick access later
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="add-circle" size={24} color="white" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Add to Workouts</Text>
                <Text style={styles.featureDescription}>
                  Integrate exercises directly into your workout routines
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Featured Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Exercise Categories</Text>
          <View style={styles.categoriesGrid}>
            {FEATURED_CATEGORIES.map((category, index) => (
              <TouchableOpacity
                key={category.name}
                style={[styles.categoryCard, { backgroundColor: category.color + '15' }]}
                onPress={() => handleCategorySelect(category.name)}
              >
                <LinearGradient
                  colors={[category.color + '20', category.color + '10']}
                  style={styles.categoryGradient}
                >
                  <Ionicons 
                    name={category.icon} 
                    size={32} 
                    color={category.color} 
                  />
                  <Text style={[styles.categoryName, { color: category.color }]}>
                    {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                  </Text>
                  <Text style={styles.categoryCount}>
                    {category.exercises} exercises
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Exercises */}
        <View style={styles.popularSection}>
          <Text style={styles.sectionTitle}>Popular This Week</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.popularGrid}>
              {POPULAR_EXERCISES.map((exercise, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.popularCard}
                  onPress={() => {
                    setSearchQuery(exercise.name);
                    handleSearchSubmit(exercise.name);
                  }}
                >
                  <View style={styles.popularImageContainer}>
                    <Image
                      source={{ uri: getExercisePlaceholder(exercise.category) }}
                      style={styles.popularImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.popularImageOverlay}
                    />
                    <View style={[styles.popularDifficulty, { backgroundColor: getDifficultyColor(exercise.difficulty) }]}>
                      <Text style={styles.popularDifficultyText}>
                        {exercise.difficulty.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.popularInfo}>
                    <Text style={styles.popularName}>{exercise.name}</Text>
                    <View style={styles.popularStats}>
                      <Ionicons name="heart" size={14} color="#FF6B35" />
                      <Text style={styles.popularSaves}>{exercise.saves}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaTitle}>Ready to Explore?</Text>
            <Text style={styles.ctaSubtitle}>
              Start searching for exercises or browse by category
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => setShowLandingPage(false)}
            >
              <Text style={styles.ctaButtonText}>Browse Exercises</Text>
              <Ionicons name="arrow-forward" size={20} color="#FF6B35" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Animated.View>
    </ScrollView>
  );

  // Search suggestions component
  const renderSearchSuggestions = () => (
    showSearchSuggestions && (searchSuggestions.length > 0 || recentSearches.length > 0) && (
      <View style={styles.suggestionsContainer}>
        {searchSuggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>Suggestions</Text>
            {searchSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSearchSubmit(suggestion)}
              >
                <Ionicons name="search" size={16} color="#666" />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {recentSearches.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>Recent Searches</Text>
            {recentSearches.slice(0, 5).map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSearchSubmit(search)}
              >
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.suggestionText}>{search}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    )
  );

  // Enhanced exercise detail modal
  const ExerciseDetailModal = () => {
    if (!selectedExercise) return null;
    
    const isSaved = savedExercises.some(e => e.id === selectedExercise.id);
    const hasImage = selectedExercise.images && selectedExercise.images.length > 0;
    const imageSource = hasImage ? { uri: selectedExercise.images[0] } : { uri: getExercisePlaceholder(selectedExercise.category) };
    
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
              {/* Modal Header with Image */}
              <View style={styles.modalImageContainer}>
                <Image
                  source={imageSource}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.modalImageOverlay}
                />
                <TouchableOpacity
                  onPress={() => setSelectedExercise(null)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                
                {/* Exercise Title on Image */}
                <View style={styles.modalImageTitle}>
                  <Text style={styles.modalTitle}>{selectedExercise.name}</Text>
                  <View style={styles.modalImageBadges}>
                    {selectedExercise.difficulty && (
                      <View style={[styles.modalDifficultyBadge, { backgroundColor: getDifficultyColor(selectedExercise.difficulty) }]}>
                        <Text style={styles.modalDifficultyText}>
                          {selectedExercise.difficulty.charAt(0).toUpperCase() + selectedExercise.difficulty.slice(1)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.modalCategoryBadge}>
                      <Text style={styles.modalCategoryText}>
                        {selectedExercise.category?.charAt(0).toUpperCase() + selectedExercise.category?.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.modalBody}>
                {/* Quick Stats */}
                <View style={styles.modalStatsContainer}>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="heart" size={20} color="#FF6B35" />
                    <Text style={styles.modalStatNumber}>{selectedExercise.saves || Math.floor(Math.random() * 500) + 50}</Text>
                    <Text style={styles.modalStatLabel}>Saves</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="time-outline" size={20} color="#4CAF50" />
                    <Text style={styles.modalStatNumber}>{selectedExercise.instructions?.length || 1}</Text>
                    <Text style={styles.modalStatLabel}>Steps</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Ionicons name={getEquipmentIcon(selectedExercise.equipment?.[0])} size={20} color="#2196F3" />
                    <Text style={styles.modalStatNumber}>{selectedExercise.equipment?.length || 1}</Text>
                    <Text style={styles.modalStatLabel}>Equipment</Text>
                  </View>
                </View>

                {/* Description */}
                {selectedExercise.description && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Description</Text>
                    <Text style={styles.modalSectionContent}>{selectedExercise.description}</Text>
                  </View>
                )}
                
                {/* Primary Muscles */}
                {selectedExercise.primary_muscles && selectedExercise.primary_muscles.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Primary Muscles</Text>
                    <View style={styles.modalMuscleContainer}>
                      {selectedExercise.primary_muscles.map((muscle, index) => (
                        <View key={index} style={[styles.modalMuscleTag, { backgroundColor: '#FF6B35' + '20' }]}>
                          <Text style={[styles.modalMuscleText, { color: '#FF6B35' }]}>
                            {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Secondary Muscles */}
                {selectedExercise.secondary_muscles && selectedExercise.secondary_muscles.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Secondary Muscles</Text>
                    <View style={styles.modalMuscleContainer}>
                      {selectedExercise.secondary_muscles.map((muscle, index) => (
                        <View key={index} style={[styles.modalMuscleTag, { backgroundColor: '#4CAF50' + '20' }]}>
                          <Text style={[styles.modalMuscleText, { color: '#4CAF50' }]}>
                            {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Equipment */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Equipment Required</Text>
                  <View style={styles.modalEquipmentContainer}>
                    {selectedExercise.equipment?.map((eq, index) => (
                      <View key={index} style={styles.modalEquipmentTag}>
                        <Ionicons 
                          name={getEquipmentIcon(eq)} 
                          size={16} 
                          color="#2196F3" 
                        />
                        <Text style={styles.modalEquipmentText}>
                          {eq.charAt(0).toUpperCase() + eq.slice(1)}
                        </Text>
                      </View>
                    )) || (
                      <Text style={styles.modalSectionContent}>No equipment required</Text>
                    )}
                  </View>
                </View>
                
                {/* Instructions */}
                {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>How to Perform</Text>
                    {selectedExercise.instructions.map((instruction, index) => (
                      <View key={index} style={styles.modalInstructionItem}>
                        <View style={styles.modalInstructionNumber}>
                          <Text style={styles.modalInstructionNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.modalInstructionText}>{instruction}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Attribution */}
                <View style={styles.modalAttributionSection}>
                  <Text style={styles.modalAttributionText}>
                    Data from {selectedExercise.source || 'exercemus'} open-source database
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionButton, isSaved && styles.modalSavedButton]}
                onPress={() => toggleSaveExercise(selectedExercise)}
              >
                <Ionicons
                  name={isSaved ? "heart" : "heart-outline"}
                  size={20}
                  color={isSaved ? "#fff" : "#FF6B35"}
                />
                <Text style={[styles.modalActionButtonText, isSaved && styles.modalSavedButtonText]}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={() => {
                  setSelectedExercise(null);
                  navigation.navigate('Generator', { 
                    suggestedExercise: selectedExercise 
                  });
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FF6B35" />
                <Text style={styles.modalActionButtonText}>Add to Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Main render
  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exercise Library</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              onPress={() => setShowFilters(!showFilters)}
              style={[styles.headerButton, showFilters && styles.activeHeaderButton]}
            >
              <Ionicons name="filter" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowSavedOnly(!showSavedOnly)}
              style={[styles.headerButton, showSavedOnly && styles.activeHeaderButton]}
            >
              <Ionicons name={showSavedOnly ? "heart" : "heart-outline"} size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Search Bar */}
        {!showLandingPage && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search 872+ exercises..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                onSubmitEditing={() => handleSearchSubmit()}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Show landing page or exercise list */}
      {showLandingPage ? (
        renderLandingPage()
      ) : (
        <>
          {/* Search Suggestions */}
          {renderSearchSuggestions()}

          {/* Filters */}
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

          {/* Exercise List */}
          {loading && initialLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingText}>Loading exercises...</Text>
            </View>
          ) : (
            <FlatList
              data={displayedExercises}
              renderItem={renderExerciseItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.exerciseList}
              numColumns={isTablet ? 2 : 1}
              key={isTablet ? 'tablet' : 'phone'}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#FF6B35"
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={64} color="#666" />
                  <Text style={styles.emptyText}>
                    {showSavedOnly ? 'No saved exercises yet' : 'No exercises found'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {showSavedOnly 
                      ? 'Save exercises to see them here' 
                      : 'Try adjusting your search or filters'
                    }
                  </Text>
                  {!showSavedOnly && (
                    <TouchableOpacity
                      style={styles.emptyAction}
                      onPress={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSelectedEquipment('all');
                        setSelectedDifficulty('all');
                        setShowLandingPage(true);
                      }}
                    >
                      <Text style={styles.emptyActionText}>Browse All Categories</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          )}
        </>
      )}

      <ExerciseDetailModal />
    </View>
  );
}

// Enhanced styles with mobile-first design
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
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
    padding: 8,
    borderRadius: 20,
  },
  activeHeaderButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchContainer: {
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: 'white',
    fontSize: 16,
  },

  // Landing Page Styles
  landingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  landingContent: {
    paddingBottom: 40,
  },
  heroSection: {
    padding: 30,
    minHeight: 280,
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    marginTop: 4,
  },

  // Sections
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  // How to Use Section
  howToUseSection: {
    paddingVertical: 40,
    backgroundColor: '#111',
  },
  featureList: {
    paddingHorizontal: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },

  // Categories Section
  categoriesSection: {
    paddingVertical: 40,
    backgroundColor: '#0a0a0a',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 15,
  },
  categoryCard: {
    width: (screenWidth - 55) / 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryGradient: {
    padding: 20,
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  categoryCount: {
    fontSize: 12,
    color: '#999',
  },

  // Popular Section
  popularSection: {
    paddingVertical: 40,
    backgroundColor: '#111',
  },
  popularGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
  },
  popularCard: {
    width: 160,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    overflow: 'hidden',
  },
  popularImageContainer: {
    position: 'relative',
  },
  popularImage: {
    width: '100%',
    height: 100,
  },
  popularImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  popularDifficulty: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularDifficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  popularInfo: {
    padding: 12,
  },
  popularName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 6,
  },
  popularStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popularSaves: {
    fontSize: 12,
    color: '#999',
  },

  // CTA Section
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  ctaGradient: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },

  // Search Suggestions
  suggestionsContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  suggestionsSection: {
    padding: 15,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  suggestionText: {
    color: '#999',
    fontSize: 14,
  },

  // Filters
  filtersContainer: {
    backgroundColor: '#111',
    paddingVertical: 15,
  },
  filterRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterLabel: {
    color: '#888',
    fontSize: 12,
    marginRight: 15,
    alignSelf: 'center',
    minWidth: 70,
    fontWeight: '600',
  },
  filterChip: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  filterChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterChipText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },

  // Exercise List
  exerciseList: {
    padding: 20,
    gap: 15,
  },
  exerciseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 15,
  },
  exerciseCardContent: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  exerciseImage: {
    width: '100%',
    height: 180,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  exerciseInfo: {
    padding: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 6,
  },
  exerciseCategory: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  muscleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  muscleText: {
    color: '#999',
    fontSize: 13,
    flex: 1,
  },
  equipmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  equipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  equipmentText: {
    color: '#999',
    fontSize: 10,
  },
  moreEquipment: {
    color: '#666',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#666',
    fontSize: 12,
  },

  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    color: '#666',
    marginTop: 15,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  emptyActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  modalImageContainer: {
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: 250,
  },
  modalImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  modalImageTitle: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  modalImageBadges: {
    flexDirection: 'row',
    gap: 10,
  },
  modalDifficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  modalDifficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalCategoryBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  modalCategoryText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  modalStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    paddingVertical: 20,
    marginBottom: 25,
  },
  modalStatItem: {
    alignItems: 'center',
    gap: 8,
  },
  modalStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#999',
  },
  modalSection: {
    marginBottom: 25,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  modalSectionContent: {
    fontSize: 14,
    color: '#999',
    lineHeight: 22,
  },
  modalMuscleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalMuscleTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  modalMuscleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalEquipmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalEquipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  modalEquipmentText: {
    color: '#999',
    fontSize: 12,
  },
  modalInstructionItem: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 12,
  },
  modalInstructionNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInstructionNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalInstructionText: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  modalAttributionSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  modalAttributionText: {
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 15,
    borderRadius: 15,
    gap: 8,
  },
  modalSavedButton: {
    backgroundColor: '#FF6B35',
  },
  modalActionButtonText: {
    color: '#FF6B35',
    fontWeight: '600',
    fontSize: 14,
  },
  modalSavedButtonText: {
    color: 'white',
  },
});