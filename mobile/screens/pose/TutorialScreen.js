/**
 * TutorialScreen - Main Tutorial Content Hub
 * 
 * Comprehensive tutorial screen with organized content categories, progress tracking,
 * and seamless integration with tutorial services and interactive components.
 * 
 * Features:
 * - Organized tutorial categories with visual navigation
 * - Progress tracking and user analytics integration
 * - Personalized content recommendations
 * - Achievement system with milestone recognition
 * - Search and filtering capabilities
 * - Offline content access
 * - Glassmorphism design system compliance
 * 
 * Integration Points:
 * - Stream A: TutorialService, ContentDeliveryService, TutorialContentManager
 * - Stream B: TutorialVideo, InteractiveTutorial, ExerciseDemonstration
 * - Existing: Navigation patterns, glassmorphism design tokens
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
  Animated,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Tutorial Components from Stream B
import TutorialVideo from '../../components/pose/TutorialVideo';
import InteractiveTutorial from '../../components/pose/InteractiveTutorial';
import ExerciseDemonstration from '../../components/pose/ExerciseDemonstration';

// Services from Stream A  
import tutorialService from '../../services/tutorialService';
import contentDeliveryService from '../../services/contentDeliveryService';
import tutorialContentManager from '../../utils/tutorialContentManager';

// Design System
import { createThemedStyles, colors, spacing, borderRadius, typography } from '../../utils/designTokens';
import { useTheme } from '../../contexts/ThemeContext';

// UI Components
import GlassSearchInput from '../../components/GlassSearchInput';
import { UnifiedLoader } from '../../components/UnifiedLoader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Tutorial Categories with enhanced metadata
const TUTORIAL_CATEGORIES = [
  {
    id: 'exercise_techniques',
    title: 'Exercise Techniques',
    icon: 'barbell-outline',
    description: 'Master proper form with step-by-step exercise breakdowns',
    color: '#FF6B35',
    contentCount: 12,
    estimatedTime: '45 min',
    difficulty: 'Beginner-Advanced',
    featured: true
  },
  {
    id: 'recording_practices',
    title: 'Recording Best Practices', 
    icon: 'videocam-outline',
    description: 'Optimize your setup for accurate pose analysis results',
    color: '#4CAF50',
    contentCount: 8,
    estimatedTime: '25 min',
    difficulty: 'Beginner',
    featured: true
  },
  {
    id: 'common_mistakes',
    title: 'Common Mistakes',
    icon: 'warning-outline', 
    description: 'Learn to identify and correct frequent form errors',
    color: '#FF9800',
    contentCount: 15,
    estimatedTime: '35 min',
    difficulty: 'Intermediate',
    featured: false
  },
  {
    id: 'progressive_movements',
    title: 'Progressive Training',
    icon: 'trending-up-outline',
    description: 'Build skills progressively from beginner to advanced',
    color: '#9C27B0',
    contentCount: 10,
    estimatedTime: '60 min',
    difficulty: 'All Levels',
    featured: false
  },
  {
    id: 'app_walkthrough',
    title: 'App Features',
    icon: 'phone-portrait-outline',
    description: 'Complete guide to using pose analysis features',
    color: '#2196F3',
    contentCount: 6,
    estimatedTime: '20 min',
    difficulty: 'Beginner',
    featured: false
  }
];

// Achievement levels and progress indicators
const PROGRESS_LEVELS = {
  NOVICE: { min: 0, max: 25, title: 'Getting Started', icon: 'play-circle' },
  LEARNER: { min: 26, max: 50, title: 'Learning', icon: 'school' },
  PRACTITIONER: { min: 51, max: 75, title: 'Practicing', icon: 'fitness' },
  EXPERT: { min: 76, max: 100, title: 'Expert', icon: 'trophy' }
};

export default function TutorialScreen({ navigation, route }) {
  const themeContext = useTheme();
  const { colors: themeColors = {} } = themeContext;
  const theme = themeColors;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tutorialContent, setTutorialContent] = useState({});
  const [userProgress, setUserProgress] = useState({});
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState('categories'); // categories, content, search

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  // Navigation params
  const { 
    initialCategory = null,
    source = 'main_navigation'
  } = route.params || {};

  useEffect(() => {
    loadTutorialData();
    setupAnimations();
  }, []);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
      setViewMode('content');
    }
  }, [initialCategory]);

  const setupAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
  };

  const loadTutorialData = async () => {
    try {
      setLoading(true);

      // Load tutorial content for all categories
      const contentPromises = TUTORIAL_CATEGORIES.map(async (category) => {
        const content = await tutorialContentManager.getTutorialsByCategory(category.id);
        return { categoryId: category.id, content };
      });

      const contentResults = await Promise.all(contentPromises);
      const contentMap = {};
      contentResults.forEach(({ categoryId, content }) => {
        contentMap[categoryId] = content;
      });

      // Load user progress and analytics
      const [progress, recommendations, userAchievements] = await Promise.all([
        tutorialService.getUserProgress(),
        tutorialContentManager.getPersonalizedTutorials(),
        tutorialService.getUserAchievements()
      ]);

      setTutorialContent(contentMap);
      setUserProgress(progress);
      setPersonalizedRecommendations(recommendations);
      setAchievements(userAchievements);

      // Track screen view
      await tutorialService.trackUserEngagement('tutorial_screen_viewed', {
        source,
        categoriesAvailable: TUTORIAL_CATEGORIES.length,
        userLevel: progress.level || 'novice'
      });

    } catch (error) {
      console.error('Failed to load tutorial data:', error);
      Alert.alert('Loading Error', 'Unable to load tutorial content. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTutorialData();
    setRefreshing(false);
  }, []);

  const handleCategorySelect = useCallback(async (category) => {
    setSelectedCategory(category);
    setViewMode('content');
    
    // Track category selection
    await tutorialService.trackUserEngagement('category_selected', {
      categoryId: category.id,
      categoryTitle: category.title,
      contentCount: tutorialContent[category.id]?.length || 0
    });
  }, [tutorialContent]);

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    
    if (query.length > 2) {
      setViewMode('search');
      // Track search
      await tutorialService.trackUserEngagement('tutorial_search', {
        query,
        queryLength: query.length
      });
    } else if (query.length === 0) {
      setViewMode('categories');
    }
  }, []);

  const toggleSearch = () => {
    const newShowSearch = !showSearch;
    setShowSearch(newShowSearch);
    
    Animated.timing(searchAnim, {
      toValue: newShowSearch ? 1 : 0,
      duration: 300,
      useNativeDriver: false
    }).start();

    if (!newShowSearch) {
      setSearchQuery('');
      setViewMode('categories');
    }
  };

  const getProgressLevel = (progressPercentage) => {
    for (const [level, data] of Object.entries(PROGRESS_LEVELS)) {
      if (progressPercentage >= data.min && progressPercentage <= data.max) {
        return { level, ...data };
      }
    }
    return { level: 'NOVICE', ...PROGRESS_LEVELS.NOVICE };
  };

  const filteredContent = useMemo(() => {
    if (searchQuery.length < 3) return [];

    const results = [];
    Object.entries(tutorialContent).forEach(([categoryId, content]) => {
      const category = TUTORIAL_CATEGORIES.find(cat => cat.id === categoryId);
      
      content.forEach(tutorial => {
        if (
          tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tutorial.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        ) {
          results.push({
            ...tutorial,
            category: category
          });
        }
      });
    });

    return results;
  }, [searchQuery, tutorialContent]);

  const styles = createStyleSheet(theme);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <UnifiedLoader size="large" />
          <Text style={styles.loadingText}>Loading tutorials...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Pose Analysis Tutorials</Text>
      
      <TouchableOpacity 
        style={styles.searchButton} 
        onPress={toggleSearch}
      >
        <Ionicons 
          name={showSearch ? "close" : "search"} 
          size={24} 
          color={theme.text} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <Animated.View 
      style={[
        styles.searchContainer,
        {
          height: searchAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 60]
          }),
          opacity: searchAnim
        }
      ]}
    >
      <GlassSearchInput
        placeholder="Search tutorials, exercises, tips..."
        value={searchQuery}
        onChangeText={handleSearch}
        autoFocus={showSearch}
        style={styles.searchInput}
      />
    </Animated.View>
  );

  const renderProgressOverview = () => {
    const overallProgress = userProgress.overallCompletionPercentage || 0;
    const progressLevel = getProgressLevel(overallProgress);

    return (
      <BlurView intensity={20} style={styles.progressCard}>
        <LinearGradient
          colors={['rgba(255, 107, 53, 0.1)', 'rgba(255, 107, 53, 0.05)']}
          style={styles.progressGradient}
        >
          <View style={styles.progressHeader}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressSubtitle}>{progressLevel.title}</Text>
            </View>
            <View style={styles.progressIconContainer}>
              <Ionicons 
                name={progressLevel.icon} 
                size={32} 
                color={colors.primary.DEFAULT} 
              />
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: `${overallProgress}%` }
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>{Math.round(overallProgress)}%</Text>
          </View>

          {achievements.length > 0 && (
            <View style={styles.achievementsPreview}>
              <Text style={styles.achievementsTitle}>Recent Achievements</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {achievements.slice(0, 3).map((achievement, index) => (
                  <View key={index} style={styles.achievementBadge}>
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </LinearGradient>
      </BlurView>
    );
  };

  const renderCategoryCard = (category, index) => {
    const categoryProgress = userProgress.categoryProgress?.[category.id] || 0;
    const isCompleted = categoryProgress >= 90;

    return (
      <Animated.View
        key={category.id}
        style={[
          styles.categoryCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 30],
                outputRange: [0, 30]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity onPress={() => handleCategorySelect(category)}>
          <BlurView intensity={15} style={styles.categoryBlur}>
            <LinearGradient
              colors={[`${category.color}15`, `${category.color}08`]}
              style={styles.categoryGradient}
            >
              {category.featured && (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredText}>Featured</Text>
                </View>
              )}
              
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                </View>
              )}

              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                  <Ionicons name={category.icon} size={28} color={category.color} />
                </View>
                <View style={styles.categoryMeta}>
                  <Text style={styles.categoryMetaText}>{category.contentCount} tutorials</Text>
                  <Text style={styles.categoryMetaText}>~{category.estimatedTime}</Text>
                </View>
              </View>

              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>

              <View style={styles.categoryFooter}>
                <View style={styles.categoryProgress}>
                  <View style={styles.categoryProgressBar}>
                    <View 
                      style={[
                        styles.categoryProgressFill,
                        { 
                          width: `${categoryProgress}%`,
                          backgroundColor: category.color
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryProgressText}>
                    {Math.round(categoryProgress)}% complete
                  </Text>
                </View>

                <View style={styles.categoryDifficulty}>
                  <Text style={styles.categoryDifficultyText}>{category.difficulty}</Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderRecommendations = () => {
    if (personalizedRecommendations.length === 0) return null;

    return (
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>Recommended For You</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {personalizedRecommendations.slice(0, 5).map((tutorial, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recommendationCard}
              onPress={() => {
                // Navigate to specific tutorial
                navigation.navigate('TutorialContent', {
                  tutorial,
                  category: TUTORIAL_CATEGORIES.find(cat => cat.id === tutorial.categoryId)
                });
              }}
            >
              <BlurView intensity={10} style={styles.recommendationBlur}>
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle} numberOfLines={2}>
                    {tutorial.title}
                  </Text>
                  <Text style={styles.recommendationCategory}>
                    {TUTORIAL_CATEGORIES.find(cat => cat.id === tutorial.categoryId)?.title}
                  </Text>
                  <View style={styles.recommendationMeta}>
                    <Text style={styles.recommendationDuration}>
                      ~{tutorial.estimatedDuration || '5'} min
                    </Text>
                    <Text style={styles.recommendationDifficulty}>
                      {tutorial.difficulty || 'Beginner'}
                    </Text>
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSearchResults = () => (
    <View style={styles.searchResults}>
      <Text style={styles.searchResultsTitle}>
        {filteredContent.length} results for "{searchQuery}"
      </Text>
      {filteredContent.map((tutorial, index) => (
        <TouchableOpacity
          key={index}
          style={styles.searchResultCard}
          onPress={() => {
            navigation.navigate('TutorialContent', {
              tutorial,
              category: tutorial.category
            });
          }}
        >
          <BlurView intensity={10} style={styles.searchResultBlur}>
            <View style={styles.searchResultContent}>
              <Text style={styles.searchResultTitle}>{tutorial.title}</Text>
              <Text style={styles.searchResultCategory}>{tutorial.category.title}</Text>
              <Text style={styles.searchResultDescription} numberOfLines={2}>
                {tutorial.description}
              </Text>
              <View style={styles.searchResultMeta}>
                <Text style={styles.searchResultDuration}>
                  ~{tutorial.estimatedDuration || '5'} min
                </Text>
                <Text style={styles.searchResultDifficulty}>
                  {tutorial.difficulty || 'Beginner'}
                </Text>
              </View>
            </View>
          </BlurView>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCategoryContent = () => {
    if (!selectedCategory || !tutorialContent[selectedCategory.id]) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No tutorials available for this category</Text>
        </View>
      );
    }

    const content = tutorialContent[selectedCategory.id];

    return (
      <View style={styles.categoryContent}>
        {/* Category Header */}
        <BlurView intensity={15} style={styles.categoryContentHeader}>
          <TouchableOpacity 
            style={styles.backToCategoriesButton}
            onPress={() => setViewMode('categories')}
          >
            <Ionicons name="chevron-back" size={20} color={theme.text} />
            <Text style={styles.backToCategoriesText}>All Categories</Text>
          </TouchableOpacity>
          
          <View style={styles.categoryContentInfo}>
            <View style={[styles.categoryContentIcon, { backgroundColor: `${selectedCategory.color}20` }]}>
              <Ionicons name={selectedCategory.icon} size={24} color={selectedCategory.color} />
            </View>
            <View>
              <Text style={styles.categoryContentTitle}>{selectedCategory.title}</Text>
              <Text style={styles.categoryContentMeta}>
                {content.length} tutorials • ~{selectedCategory.estimatedTime}
              </Text>
            </View>
          </View>
        </BlurView>

        {/* Tutorial List */}
        <ScrollView style={styles.tutorialList} showsVerticalScrollIndicator={false}>
          {content.map((tutorial, index) => {
            const isCompleted = userProgress.completedTutorials?.includes(tutorial.id);
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.tutorialCard}
                onPress={() => {
                  navigation.navigate('TutorialContent', {
                    tutorial,
                    category: selectedCategory
                  });
                }}
              >
                <BlurView intensity={10} style={styles.tutorialCardBlur}>
                  <View style={styles.tutorialCardContent}>
                    {isCompleted && (
                      <View style={styles.tutorialCompletedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      </View>
                    )}
                    
                    <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                    <Text style={styles.tutorialDescription} numberOfLines={2}>
                      {tutorial.description}
                    </Text>
                    
                    <View style={styles.tutorialMeta}>
                      <Text style={styles.tutorialDuration}>
                        ~{tutorial.estimatedDuration || '5'} min
                      </Text>
                      <Text style={styles.tutorialDifficulty}>
                        {tutorial.difficulty || 'Beginner'}
                      </Text>
                      <Text style={styles.tutorialType}>
                        {tutorial.contentType || 'Interactive'}
                      </Text>
                    </View>
                    
                    <TouchableOpacity style={styles.tutorialPlayButton}>
                      <Ionicons name="play-circle" size={20} color={selectedCategory.color} />
                      <Text style={[styles.tutorialPlayText, { color: selectedCategory.color }]}>
                        {isCompleted ? 'Review' : 'Start'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderMainContent = () => {
    switch (viewMode) {
      case 'search':
        return renderSearchResults();
      case 'content':
        return renderCategoryContent();
      case 'categories':
      default:
        return (
          <ScrollView
            style={styles.categoriesScrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary.DEFAULT}
                colors={[colors.primary.DEFAULT]}
              />
            }
          >
            {renderProgressOverview()}
            {renderRecommendations()}
            
            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Tutorial Categories</Text>
              <View style={styles.categoriesGrid}>
                {TUTORIAL_CATEGORIES.map((category, index) => 
                  renderCategoryCard(category, index)
                )}
              </View>
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {showSearch && renderSearchBar()}
      {renderMainContent()}
    </SafeAreaView>
  );
}

const createStyleSheet = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  loadingText: {
    ...typography.body,
    color: theme.text.secondary,
    marginTop: spacing.md
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.light
  },
  backButton: {
    padding: spacing.xs
  },
  headerTitle: {
    ...typography.h3,
    color: theme.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md
  },
  searchButton: {
    padding: spacing.xs
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    overflow: 'hidden'
  },
  searchInput: {
    marginHorizontal: 0
  },
  categoriesScrollView: {
    flex: 1
  },
  progressCard: {
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden'
  },
  progressGradient: {
    padding: spacing.lg
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  progressInfo: {
    flex: 1
  },
  progressTitle: {
    ...typography.h3,
    color: theme.text.primary
  },
  progressSubtitle: {
    ...typography.body,
    color: theme.text.secondary,
    marginTop: spacing.xs
  },
  progressIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 4,
    marginRight: spacing.sm
  },
  progressFill: {
    height: 8,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 4
  },
  progressPercentage: {
    ...typography.caption,
    color: theme.text.primary,
    fontWeight: 'bold'
  },
  achievementsPreview: {
    marginTop: spacing.md
  },
  achievementsTitle: {
    ...typography.h4,
    color: theme.text.primary,
    marginBottom: spacing.sm
  },
  achievementBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    alignItems: 'center',
    minWidth: 80
  },
  achievementIcon: {
    fontSize: 16,
    marginBottom: spacing.xs
  },
  achievementName: {
    ...typography.caption,
    color: theme.text.primary,
    textAlign: 'center'
  },
  recommendationsSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg
  },
  sectionTitle: {
    ...typography.h2,
    color: theme.text.primary,
    marginBottom: spacing.md
  },
  recommendationCard: {
    width: 200,
    marginRight: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden'
  },
  recommendationBlur: {
    borderRadius: borderRadius.lg
  },
  recommendationContent: {
    padding: spacing.md
  },
  recommendationTitle: {
    ...typography.h4,
    color: theme.text.primary,
    marginBottom: spacing.xs
  },
  recommendationCategory: {
    ...typography.caption,
    color: theme.text.secondary,
    marginBottom: spacing.sm
  },
  recommendationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm
  },
  recommendationDuration: {
    ...typography.caption,
    color: colors.primary.DEFAULT
  },
  recommendationDifficulty: {
    ...typography.caption,
    color: theme.text.secondary
  },
  categoriesSection: {
    paddingHorizontal: spacing.md
  },
  categoriesGrid: {
    marginBottom: spacing.xl
  },
  categoryCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden'
  },
  categoryBlur: {
    borderRadius: borderRadius.lg
  },
  categoryGradient: {
    padding: spacing.lg,
    position: 'relative'
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm
  },
  featuredText: {
    ...typography.caption,
    color: 'white',
    fontWeight: 'bold'
  },
  completedBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center'
  },
  categoryMeta: {
    alignItems: 'flex-end'
  },
  categoryMetaText: {
    ...typography.caption,
    color: theme.text.secondary,
    marginBottom: spacing.xs
  },
  categoryTitle: {
    ...typography.h3,
    color: theme.text.primary,
    marginBottom: spacing.xs
  },
  categoryDescription: {
    ...typography.body,
    color: theme.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 22
  },
  categoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  categoryProgress: {
    flex: 1,
    marginRight: spacing.md
  },
  categoryProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: spacing.xs
  },
  categoryProgressFill: {
    height: 4,
    borderRadius: 2
  },
  categoryProgressText: {
    ...typography.caption,
    color: theme.text.secondary
  },
  categoryDifficulty: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm
  },
  categoryDifficultyText: {
    ...typography.caption,
    color: theme.text.primary
  },
  searchResults: {
    flex: 1,
    padding: spacing.md
  },
  searchResultsTitle: {
    ...typography.h3,
    color: theme.text.primary,
    marginBottom: spacing.lg
  },
  searchResultCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden'
  },
  searchResultBlur: {
    borderRadius: borderRadius.lg
  },
  searchResultContent: {
    padding: spacing.md
  },
  searchResultTitle: {
    ...typography.h4,
    color: theme.text.primary,
    marginBottom: spacing.xs
  },
  searchResultCategory: {
    ...typography.caption,
    color: colors.primary.DEFAULT,
    marginBottom: spacing.sm
  },
  searchResultDescription: {
    ...typography.body,
    color: theme.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 20
  },
  searchResultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  searchResultDuration: {
    ...typography.caption,
    color: theme.text.secondary
  },
  searchResultDifficulty: {
    ...typography.caption,
    color: theme.text.secondary
  },
  categoryContent: {
    flex: 1
  },
  categoryContentHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.light
  },
  backToCategoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  backToCategoriesText: {
    ...typography.body,
    color: theme.text.primary,
    marginLeft: spacing.xs
  },
  categoryContentInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  categoryContentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md
  },
  categoryContentTitle: {
    ...typography.h3,
    color: theme.text.primary
  },
  categoryContentMeta: {
    ...typography.caption,
    color: theme.text.secondary
  },
  tutorialList: {
    flex: 1,
    padding: spacing.md
  },
  tutorialCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden'
  },
  tutorialCardBlur: {
    borderRadius: borderRadius.lg
  },
  tutorialCardContent: {
    padding: spacing.md,
    position: 'relative'
  },
  tutorialCompletedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md
  },
  tutorialTitle: {
    ...typography.h4,
    color: theme.text.primary,
    marginBottom: spacing.xs,
    marginRight: spacing.lg
  },
  tutorialDescription: {
    ...typography.body,
    color: theme.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 20
  },
  tutorialMeta: {
    flexDirection: 'row',
    marginBottom: spacing.sm
  },
  tutorialDuration: {
    ...typography.caption,
    color: theme.text.secondary,
    marginRight: spacing.md
  },
  tutorialDifficulty: {
    ...typography.caption,
    color: theme.text.secondary,
    marginRight: spacing.md
  },
  tutorialType: {
    ...typography.caption,
    color: theme.text.secondary
  },
  tutorialPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start'
  },
  tutorialPlayText: {
    ...typography.button,
    marginLeft: spacing.xs
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  emptyStateText: {
    ...typography.body,
    color: theme.text.secondary,
    textAlign: 'center'
  }
});
