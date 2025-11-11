import React, { memo, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

// Generate local SVG placeholder for exercises without images
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
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23${color}' opacity='0.05'/%3E%3Crect x='0' y='170' width='300' height='30' fill='%23${color}' opacity='0.1'/%3E%3Cg transform='translate(150, 85)'%3E%3Ccircle r='40' fill='none' stroke='%23${color}' stroke-width='2' opacity='0.3'/%3E%3Cpath d='M-20,-10 L-10,-10 L-10,10 L-20,10 M10,-10 L20,-10 L20,10 L10,10 M-10,-5 L10,-5' stroke='%23${color}' stroke-width='2' fill='none' opacity='0.4'/%3E%3C/g%3E%3Ctext x='150' y='188' text-anchor='middle' fill='%23${color}' font-family='system-ui' font-size='11' font-weight='500' opacity='0.7'%3E${displayName}%3C/text%3E%3C/svg%3E`;
};

/**
 * SearchResults Component
 * 
 * Features:
 * - Virtualized list for performance
 * - Search term highlighting
 * - Result count and timing
 * - Optimistic UI updates
 * - Smooth animations
 * - Fast image loading with placeholders
 */
const SearchResults = memo(({
  exercises = [],
  searchQuery = '',
  highlightTerms = [],
  searchSummary = '',
  isLoading = false,
  onExercisePress,
  onToggleSave,
  savedExercises = [],
  onRefresh,
  isRefreshing = false,
  getItemLayout,
  maxToRenderPerBatch = 10,
  initialNumToRender = 20,
  windowSize = 10
}) => {
  const [imageLoadStates, setImageLoadStates] = useState({});
  
  const handleImageLoad = (exerciseId) => {
    setImageLoadStates(prev => ({
      ...prev,
      [exerciseId]: 'loaded'
    }));
  };
  
  const handleImageError = (exerciseId) => {
    setImageLoadStates(prev => ({
      ...prev,
      [exerciseId]: 'error'
    }));
  };
  
  const isExerciseSaved = (exerciseId) => {
    return savedExercises.some(e => e.id === exerciseId);
  };
  
  
  const renderExerciseItem = ({ item, index }) => {
    const isSaved = isExerciseSaved(item.id);
    const imageState = imageLoadStates[item.id] || 'loading';
    
    return (
      <Animated.View
        style={[
          styles.exerciseCard,
          {
            opacity: 1,
            transform: [
              {
                translateY: 0
              }
            ]
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => onExercisePress(item)}
          activeOpacity={0.8}
        >
          {/* Exercise Image */}
          <View style={styles.imageContainer}>
            {imageState === 'loading' && (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={32} color="#666" />
              </View>
            )}
            
            <Image
              source={{
                uri: (() => {
                  const imageUrl = item.images?.[0];
                  if (imageUrl) {
                    if (imageUrl.startsWith('http')) {
                      return imageUrl;
                    }
                    // Example path: /wrkout-exercises/exercises/3_4_Sit-Up/images/0.jpg
                    const pathParts = imageUrl.split('/');
                    if (pathParts.length > 4) {
                      const exerciseDir = pathParts[3];
                      const imageName = pathParts[5];
                      return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${exerciseDir}/images/${imageName}`;
                    }
                  }
                  return item.placeholder || getExercisePlaceholder(item.category, item.name);
                })()
              }}
              style={[
                styles.exerciseImage,
                imageState === 'loaded' && styles.imageLoaded
              ]}
              resizeMode="cover"
              onLoad={() => handleImageLoad(item.id)}
              onError={() => handleImageError(item.id)}
            />
            
            {/* Difficulty Badge */}
            {item.difficulty && (
              <View style={[
                styles.difficultyBadge,
                styles[`difficulty${item.difficulty}`]
              ]}>
                <Text style={styles.difficultyText}>
                  {item.difficulty}
                </Text>
              </View>
            )}
            
            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => onToggleSave(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSaved ? "heart" : "heart-outline"}
                size={20}
                color={isSaved ? "#FF6B35" : "white"}
              />
            </TouchableOpacity>
          </View>
          
          {/* Exercise Info */}
          <View style={styles.exerciseContent}>
            <Text style={styles.exerciseName} numberOfLines={2}>
              {typeof item.name === 'string' ? item.name : ''}
            </Text>
            
            <View style={styles.exerciseMetadata}>
              <View style={styles.categoryContainer}>
                <Text style={styles.exerciseCategory}>
                  {typeof item.category === 'string' ? item.category : ''}
                </Text>
              </View>
              
              {item.equipment && item.equipment !== 'none' && (
                <View style={styles.equipmentContainer}>
                  <Ionicons 
                    name="barbell-outline" 
                    size={12} 
                    color="#666" 
                    style={styles.equipmentIcon}
                  />
                  <Text style={styles.equipmentText}>
                    {Array.isArray(item.equipment) ? item.equipment.join(', ') : (typeof item.equipment === 'string' ? item.equipment : '')}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Primary Muscles */}
            {item.primaryMuscles && item.primaryMuscles.length > 0 && (
              <View style={styles.musclesContainer}>
                <Ionicons 
                  name="body-outline" 
                  size={12} 
                  color="#666" 
                  style={styles.muscleIcon}
                />
                <Text style={styles.musclesText} numberOfLines={1}>
                  {item.primaryMuscles.slice(0, 3).map(muscle => 
                    muscle.charAt(0).toUpperCase() + muscle.slice(1)
                  ).join(', ')}
                  {item.primaryMuscles.length > 3 && ` +${item.primaryMuscles.length - 3}`}
                </Text>
              </View>
            )}
            
            {/* Search Score (for debugging - remove in production) */}
            {__DEV__ && item.searchScore && (
              <Text style={styles.searchScore}>
                Score: {item.searchScore}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const keyExtractor = (item, index) => `${item.id}_${index}`;
  
  const getItemLayoutOptimized = useMemo(() => {
    if (getItemLayout) return getItemLayout;
    
    // Estimate item height for better performance
    const ITEM_HEIGHT = 280; // Approximate height of each exercise card
    return (data, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    });
  }, [getItemLayout]);
  
  const ListHeaderComponent = () => {
    if (!searchSummary) return null;
    
    return (
      <View style={styles.searchSummaryContainer}>
        <Text style={styles.searchSummaryText}>{searchSummary}</Text>
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <Ionicons name="sync-outline" size={14} color="#FF6B35" />
          </View>
        )}
      </View>
    );
  };
  
  const ListEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>Searching exercises...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color="#666" />
        <Text style={styles.emptyText}>No exercises found</Text>
        <Text style={styles.emptySubtext}>
          Try adjusting your search terms or filters
        </Text>
      </View>
    );
  };
  
  return (
    <FlatList
      data={exercises}
      renderItem={renderExerciseItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayoutOptimized}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={exercises.length === 0 ? styles.emptyListContainer : styles.listContainer}
      showsVerticalScrollIndicator={false}
      
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={maxToRenderPerBatch}
      initialNumToRender={initialNumToRender}
      windowSize={windowSize}
      updateCellsBatchingPeriod={50}
      
      // Refresh control
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B35"
            colors={['#FF6B35']}
          />
        ) : undefined
      }
      
      // Scroll optimizations
      decelerationRate="fast"
      disableIntervalMomentum={true}
      snapToAlignment="start"
      
      // Memory optimizations
      legacyImplementation={false}
    />
  );
});

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  searchSummaryContainer: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  searchSummaryText: {
    color: '#888',
    fontSize: 14,
  },
  exerciseCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    opacity: 0,
    transition: 'opacity 0.3s',
  },
  imageLoaded: {
    opacity: 1,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  difficultybeginner: {
    backgroundColor: '#4CAF50',
  },
  difficultyintermediate: {
    backgroundColor: '#FF9800',
  },
  difficultyexpert: {
    backgroundColor: '#F44336',
  },
  difficultyText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  exerciseContent: {
    padding: 20,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
  },
  exerciseMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  categoryContainer: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  exerciseCategory: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  equipmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  equipmentIcon: {
    marginRight: 6,
  },
  equipmentText: {
    color: '#DDD',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  musclesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 12,
  },
  muscleIcon: {
    marginRight: 8,
  },
  musclesText: {
    color: '#AAA',
    fontSize: 13,
    flex: 1,
  },
  searchScore: {
    color: '#666',
    fontSize: 10,
    marginTop: 8,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

SearchResults.displayName = 'SearchResults';

export default SearchResults;