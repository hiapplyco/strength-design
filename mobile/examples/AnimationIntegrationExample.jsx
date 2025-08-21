import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  NeonBorderCard, 
  useTransition,
  PixelShimmerLoader 
} from '../components/animations';

// Example 1: Workout Card with Neon Border
export const WorkoutCardExample = ({ workout }) => {
  const { startTransition } = useTransition();
  
  const handleStartWorkout = () => {
    // Start transition before navigation
    startTransition('workoutGeneration');
    
    setTimeout(() => {
      // Navigate to workout details
      navigation.navigate('WorkoutDetail', { workoutId: workout.id });
    }, 100);
  };
  
  return (
    <NeonBorderCard
      colors={['#00FF88', '#00D4FF', '#FF00FF']}
      borderWidth={2}
      borderRadius={20}
      glowIntensity={25}
      animationDuration={3000}
      style={styles.cardContainer}
    >
      <TouchableOpacity onPress={handleStartWorkout}>
        <View style={styles.workoutContent}>
          <Text style={styles.workoutTitle}>{workout.name}</Text>
          <Text style={styles.workoutDuration}>{workout.duration} min</Text>
          
          <View style={styles.exerciseList}>
            {workout.exercises?.slice(0, 3).map((exercise, index) => (
              <View key={index} style={styles.exerciseItem}>
                <Ionicons name="fitness" size={16} color="#00D4FF" />
                <Text style={styles.exerciseName}>{exercise.name}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Workout</Text>
            <Ionicons name="arrow-forward" size={20} color="#00FF88" />
          </View>
        </View>
      </TouchableOpacity>
    </NeonBorderCard>
  );
};

// Example 2: Search with Pixel Transition
export const SearchWithTransitionExample = () => {
  const { batchTransition } = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  
  const handleSearch = async () => {
    try {
      // Use batchTransition to wrap API call
      const searchResults = await batchTransition(
        async () => {
          // Your API call here
          const response = await api.searchExercises(searchQuery);
          return response.data;
        },
        'exerciseSearch', // Use preset
        { message: `Searching for "${searchQuery}"...` } // Override message
      );
      
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };
  
  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search exercises..."
        onSubmitEditing={handleSearch}
      />
      
      <ScrollView style={styles.resultsContainer}>
        {results.map((result) => (
          <NeonBorderCard
            key={result.id}
            colors={['#FFD700', '#FF6B6B', '#4ECDC4']}
            borderWidth={1}
            style={styles.resultCard}
          >
            <Text style={styles.resultName}>{result.name}</Text>
            <Text style={styles.resultCategory}>{result.category}</Text>
          </NeonBorderCard>
        ))}
      </ScrollView>
    </View>
  );
};

// Example 3: Achievement Unlock Animation
export const AchievementUnlockExample = () => {
  const { startTransition } = useTransition();
  const [showAchievement, setShowAchievement] = useState(false);
  
  const unlockAchievement = () => {
    // Start achievement animation
    startTransition('achievementUnlock', {
      message: '🏆 New Record!',
      duration: 3000,
    });
    
    setShowAchievement(true);
  };
  
  return (
    <TouchableOpacity onPress={unlockAchievement}>
      <NeonBorderCard
        colors={['#FFD700', '#FFA500', '#FF6347']}
        borderWidth={3}
        glowIntensity={40}
      >
        <View style={styles.achievementContent}>
          <Ionicons name="trophy" size={48} color="#FFD700" />
          <Text style={styles.achievementTitle}>Complete 10 Workouts</Text>
          <Text style={styles.achievementProgress}>9/10 Complete</Text>
        </View>
      </NeonBorderCard>
    </TouchableOpacity>
  );
};

// Example 4: Workout Generation with Human Figure Pattern
export const WorkoutGeneratorExample = () => {
  const { startTransition, endTransition } = useTransition();
  const [generating, setGenerating] = useState(false);
  
  const generateWorkout = async () => {
    setGenerating(true);
    
    // Start human figure animation
    startTransition({
      pattern: 'humanFigure',
      colors: ['#00FF88', '#00D4FF', '#FF00FF'],
      message: 'Analyzing your fitness profile...',
      duration: 3000,
      direction: 'outward',
      pixelSize: 12,
    });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Success - end transition
      endTransition();
      
      // Navigate to generated workout
      navigation.navigate('GeneratedWorkout');
    } catch (error) {
      endTransition();
      Alert.alert('Error', 'Failed to generate workout');
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <View style={styles.generatorContainer}>
      <TouchableOpacity 
        onPress={generateWorkout}
        disabled={generating}
      >
        <NeonBorderCard
          colors={['#00FF88', '#00D4FF']}
          borderWidth={2}
          animationDuration={2000}
        >
          <View style={styles.generatorContent}>
            <Ionicons name="sparkles" size={32} color="#00FF88" />
            <Text style={styles.generatorTitle}>AI Workout Generator</Text>
            <Text style={styles.generatorSubtitle}>
              Create a personalized workout based on your goals
            </Text>
            <View style={styles.generatorButton}>
              <Text style={styles.generatorButtonText}>
                {generating ? 'Generating...' : 'Generate Workout'}
              </Text>
            </View>
          </View>
        </NeonBorderCard>
      </TouchableOpacity>
    </View>
  );
};

// Example 5: Page Navigation with Transitions
export const NavigationWithTransitionExample = ({ navigation }) => {
  const { startTransition } = useTransition();
  
  const navigateWithTransition = (screen, transitionType = 'pageTransition') => {
    // Start transition
    startTransition(transitionType);
    
    // Navigate after a short delay
    setTimeout(() => {
      navigation.navigate(screen);
    }, 100);
  };
  
  return (
    <View style={styles.navContainer}>
      <TouchableOpacity 
        onPress={() => navigateWithTransition('Workouts', 'workoutGeneration')}
      >
        <NeonBorderCard colors={['#00FF88', '#00D4FF']}>
          <Text style={styles.navText}>Go to Workouts</Text>
        </NeonBorderCard>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => navigateWithTransition('Profile', 'profileLoad')}
      >
        <NeonBorderCard colors={['#00D4FF', '#8A2BE2']}>
          <Text style={styles.navText}>Go to Profile</Text>
        </NeonBorderCard>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 10,
  },
  workoutContent: {
    padding: 20,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  workoutDuration: {
    fontSize: 14,
    color: '#00D4FF',
    marginBottom: 16,
  },
  exerciseList: {
    marginBottom: 20,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  exerciseName: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  startButtonText: {
    color: '#00FF88',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
  },
  resultsContainer: {
    flex: 1,
  },
  resultCard: {
    marginVertical: 8,
    padding: 16,
  },
  resultName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCategory: {
    color: '#FFD700',
    fontSize: 14,
    marginTop: 4,
  },
  achievementContent: {
    alignItems: 'center',
    padding: 24,
  },
  achievementTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  achievementProgress: {
    color: '#FFD700',
    fontSize: 14,
    marginTop: 8,
  },
  generatorContainer: {
    padding: 16,
  },
  generatorContent: {
    alignItems: 'center',
    padding: 24,
  },
  generatorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  generatorSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  generatorButton: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  generatorButtonText: {
    color: '#00FF88',
    fontSize: 16,
    fontWeight: '600',
  },
  navContainer: {
    padding: 16,
  },
  navText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    padding: 16,
  },
});