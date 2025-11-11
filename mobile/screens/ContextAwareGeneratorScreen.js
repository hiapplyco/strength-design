import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { functions, db, auth } from '../firebaseConfig';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import contextAggregator from '../services/contextAggregator';
import healthService from '../services/healthService';
import aiService from '../services/aiService';
import formContextService from '../services/formContextService';
import MarkdownRenderer from '../components/MarkdownRenderer';
import GlobalContextStatusLine from '../components/GlobalContextStatusLine';
import FormAwareCoachingCard from '../components/ai/FormAwareCoachingCard';
import ProgressIntegrationWidget from '../components/ai/ProgressIntegrationWidget';


export default function ContextAwareGeneratorScreen({ navigation, route }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [userContext, setUserContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cachedResponses, setCachedResponses] = useState({});
  const [programContext, setProgramContext] = useState(null);
  // Form-aware coaching state
  const [formContextStatus, setFormContextStatus] = useState(null);
  const [isFormAwareMode, setIsFormAwareMode] = useState(false);
  const [formAnalysisData, setFormAnalysisData] = useState(null);
  const [coachingMode, setCoachingMode] = useState('general'); // 'general', 'form-aware', 'workout-generation'
  // Form progress integration state
  const [formProgressData, setFormProgressData] = useState(null);
  const [aiRecommendations, setAIRecommendations] = useState(null);
  const [showProgressWidget, setShowProgressWidget] = useState(false);
  
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check for program context from navigation
    if (route?.params?.programContext) {
      setProgramContext(route.params.programContext);
    }

    // Check for form analysis data from navigation
    if (route?.params?.formAnalysisData) {
      setFormAnalysisData(route.params.formAnalysisData);
      setIsFormAwareMode(true);
      setCoachingMode('form-aware');
    }
    
    // Clear old cached messages on mount
    AsyncStorage.removeItem('chatCache').catch(() => {});
    
    initializeChat();
    loadCachedResponses();
    initializeFormAwareMode();
  }, [route?.params]);

  const initializeChat = async () => {
    try {
      setContextLoading(true);
      
      // Show initial analyzing message
      setMessages([{ 
        role: 'assistant', 
        content: '🔍 **Analyzing your context...**\n\nI\'m gathering information from:\n• Your profile and fitness goals\n• Exercise preferences and favorites\n• Workout history and patterns\n• Health data and biometrics\n• Previous chat conversations\n• Selected programs and preferences\n\nThis helps me create truly personalized workout plans tailored specifically to you...' 
      }]);
      
      // Load user context with program context if available
      const context = await contextAggregator.getContext();
      const contextWithProgram = contextAggregator.buildContext(programContext);
      setUserContext(contextWithProgram);
      
      // Wait a moment for effect, then show personalized greeting
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate personalized greeting
      let greeting = generatePersonalizedGreeting(contextWithProgram, programContext);
      // Remove any old button references that might be cached
      greeting = greeting.replace(/Browse.*?Profile/gs, '').replace(/\n\n+/g, '\n\n');
      setMessages([{ role: 'assistant', content: greeting }]);
      
      // Animate entry
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (error) {
      console.error('Error initializing chat:', error);
      setMessages([{
        role: 'assistant',
        content: '👋 Welcome! I\'m ready to create your personalized workout plan. How can I help you today?'
      }]);
    } finally {
      setContextLoading(false);
    }
  };

  const initializeFormAwareMode = async () => {
    try {
      console.log('🎯 Initializing form-aware AI coaching mode...');
      
      // Initialize AI service
      const aiInitResult = await aiService.initialize();
      if (!aiInitResult.success) {
        console.warn('⚠️ AI service initialization failed:', aiInitResult.message);
      }

      // Check if form context is active from navigation params or previous session
      const formStatus = aiService.getFormContextStatus();
      setFormContextStatus(formStatus);

      // If we have form analysis data from navigation, update the AI service
      if (formAnalysisData && route?.params?.exerciseType) {
        aiService.updateFormAnalysisContext(route.params.exerciseType, formAnalysisData);
        setIsFormAwareMode(true);
        setCoachingMode('form-aware');
        
        console.log('🎯 Form-aware mode activated', {
          exerciseType: route.params.exerciseType,
          hasFormData: true,
        });
      } else if (formStatus.isActive) {
        // Resume previous form context session
        setIsFormAwareMode(true);
        setCoachingMode('form-aware');
        
        console.log('🔄 Resuming form-aware session', {
          exerciseType: formStatus.currentExercise,
          lastAnalysis: formStatus.lastAnalysis,
        });
      }

      // Load form progress data if in form-aware mode
      if (isFormAwareMode && formStatus.currentExercise) {
        await loadFormProgressData(formStatus.currentExercise);
      }

    } catch (error) {
      console.error('❌ Error initializing form-aware mode:', error);
    }
  };

  const loadFormProgressData = async (exerciseType) => {
    try {
      console.log('📊 Loading form progress data...', { exerciseType });

      // Get form progress data from pose progress service
      const { default: poseProgressService } = await import('../services/poseProgressService');
      
      // Get recent progress data
      const progressData = await poseProgressService.getExerciseProgress(exerciseType, {
        limit: 20,
        timeRange: '30d',
        includeDetails: true,
      });

      if (progressData?.length > 0) {
        // Process progress data for display
        const processedData = processFormProgressData(progressData);
        setFormProgressData(processedData);
        setShowProgressWidget(true);

        // Generate AI recommendations based on progress
        await generateProgressBasedRecommendations(exerciseType, progressData);
      }

    } catch (error) {
      console.error('❌ Error loading form progress data:', error);
    }
  };

  const processFormProgressData = (progressData) => {
    if (!progressData || progressData.length === 0) return null;

    // Calculate overall trend
    const scores = progressData.map(session => session.overallScore || session.score || 0);
    const recentScores = scores.slice(0, 5);
    const olderScores = scores.slice(5, 10);
    
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.length > 0 ? 
      olderScores.reduce((a, b) => a + b, 0) / olderScores.length : recentAvg;
    
    const overallImprovement = ((recentAvg - olderAvg) / olderAvg) * 100;

    // Extract key metrics improvements
    const keyMetrics = {};
    const commonMetrics = ['posture', 'balance', 'range_of_motion', 'alignment'];
    
    commonMetrics.forEach(metric => {
      const metricScores = progressData
        .map(session => session.details?.[metric] || session[metric])
        .filter(score => score !== undefined);
      
      if (metricScores.length > 1) {
        const recent = metricScores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const older = metricScores.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
        const improvement = older > 0 ? ((recent - older) / older) * 100 : 0;
        
        keyMetrics[metric] = { improvement: Math.round(improvement) };
      }
    });

    return {
      overallTrend: {
        improvement: Math.round(overallImprovement),
        description: overallImprovement > 5 ? 
          'Great progress! Your form is consistently improving.' :
          overallImprovement > 0 ?
          'Steady improvement in your form technique.' :
          'Focus on the coaching tips to improve your form.',
      },
      keyMetrics,
      recentSessions: progressData.slice(0, 10).map(session => ({
        score: session.overallScore || session.score || 0,
        date: session.timestamp || session.createdAt,
      })),
    };
  };

  const generateProgressBasedRecommendations = async (exerciseType, progressData) => {
    try {
      // Use AI service to generate recommendations based on progress
      const recommendations = await aiService.getPersonalizedCoachingCues(
        exerciseType,
        formAnalysisData,
        {
          coachingStyle: formContextStatus?.coachingStyle || 'supportive',
          focusAreas: extractFocusAreasFromProgress(progressData),
          includeHistory: true,
        }
      );

      if (recommendations) {
        const processedRecommendations = {
          workoutAdjustments: recommendations.workoutAdjustments || [],
          techniqueImprovements: recommendations.techniqueImprovements || [],
          focusAreas: recommendations.focusAreas || extractFocusAreasFromProgress(progressData),
        };

        setAIRecommendations(processedRecommendations);
      }

    } catch (error) {
      console.error('❌ Error generating progress-based recommendations:', error);
    }
  };

  const extractFocusAreasFromProgress = (progressData) => {
    if (!progressData || progressData.length === 0) return [];

    const commonIssues = [];
    const issueCount = {};

    progressData.forEach(session => {
      if (session.criticalErrors) {
        session.criticalErrors.forEach(error => {
          issueCount[error] = (issueCount[error] || 0) + 1;
        });
      }
    });

    // Return top 3 most common issues
    return Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([issue]) => issue);
  };

  const generatePersonalizedGreeting = (context, programContext = null) => {
    const { user, workoutHistory, health, insights, recommendations, selectedProgram, programInsights } = context;
    
    let greeting = `👋 **Welcome back, ${user?.displayName || 'there'}!**\n\n`;

    // Add form-aware coaching context if active
    if (isFormAwareMode && formContextStatus) {
      greeting += `🎯 **Form-Aware Coaching Mode Active!**\n\n`;
      
      if (formContextStatus.currentExercise) {
        greeting += `I'm now analyzing your **${formContextStatus.currentExercise}** form and providing personalized coaching based on your movement patterns.\n\n`;
      }
      
      if (formAnalysisData && formAnalysisData.overallScore) {
        greeting += `📊 **Latest Form Analysis:**\n`;
        greeting += `• Overall Score: ${Math.round(formAnalysisData.overallScore)}/100\n`;
        if (formAnalysisData.strengths?.length > 0) {
          greeting += `• Strong Areas: ${formAnalysisData.strengths.slice(0, 2).join(', ')}\n`;
        }
        if (formAnalysisData.improvements?.length > 0) {
          greeting += `• Focus Areas: ${formAnalysisData.improvements.slice(0, 2).join(', ')}\n`;
        }
        greeting += `\n`;
      }
      
      greeting += `I'll provide coaching advice specifically tailored to improve your form, prevent injuries, and optimize your training based on your actual movement analysis.\n\n`;
    }
    
    // Add program-specific greeting if a program was selected
    if (selectedProgram && programInsights) {
      greeting += `🎯 **I see you selected "${selectedProgram.name}" by ${selectedProgram.creator}!**\n\n`;
      greeting += `This is a ${selectedProgram.goals?.toLowerCase() || 'fitness'} program designed for ${selectedProgram.experienceLevel?.toLowerCase() || 'all levels'}. `;
      
      if (programInsights.compatibility === 'excellent') {
        greeting += `Perfect match for your current level! 🎉\n\n`;
      } else if (programInsights.compatibility === 'challenging') {
        greeting += `This will be a great challenge to help you grow! 💪\n\n`;
      } else if (programInsights.compatibility === 'easy') {
        greeting += `This should be manageable and help build consistency! 📈\n\n`;
      }
      
      greeting += `I'll help you adapt this program to your specific needs, available equipment, and preferences. `;
      greeting += `Let's create a personalized version that works perfectly for you!\n\n`;
      
      if (programInsights.adjustments?.length > 0) {
        greeting += `**Key Adjustments I'll Make:**\n`;
        programInsights.adjustments.forEach(adjustment => {
          greeting += `• ${adjustment}\n`;
        });
        greeting += `\n`;
      }
    }`;
    
    // Add context-aware information
    if (workoutHistory?.stats?.totalWorkouts > 0) {
      greeting += `📊 **Your Progress:**\n`;
      greeting += `• ${workoutHistory.stats.totalWorkouts} workouts completed in the last 30 days\n`;
      greeting += `• Favorite workout time: ${workoutHistory.stats.favoriteTime}\n`;
      greeting += `• Consistency score: ${Math.round(context.performance?.consistency * 100)}%\n\n`;
    }
    
    if (health?.today && health.isConnected) {
      greeting += `💪 **Today's Health Stats:**\n`;
      if (health.today.steps) greeting += `• Steps: ${health.today.steps.toLocaleString()}\n`;
      if (health.today.calories) greeting += `• Calories burned: ${health.today.calories}\n`;
      if (health.today.sleep) greeting += `• Sleep: ${health.today.sleep} hours\n`;
      greeting += '\n';
    }
    
    if (insights?.strengths?.length > 0) {
      greeting += `✨ **Your Strengths:**\n`;
      insights.strengths.forEach(strength => {
        greeting += `• ${strength}\n`;
      });
      greeting += '\n';
    }
    
    if (recommendations?.workoutFocus?.length > 0) {
      greeting += `🎯 **Today's Recommendations:**\n`;
      recommendations.workoutFocus.slice(0, 2).forEach(rec => {
        greeting += `• ${rec}\n`;
      });
      greeting += '\n';
    }
    
    greeting += `**How can I help you today?**\n\n`;
    greeting += `💪 Generate a personalized workout\n`;
    greeting += `🔧 Adjust your current program\n`;
    greeting += `🥗 Get nutrition guidance\n`;
    greeting += `📊 Review your progress`;
    
    return greeting;
  };

  const loadCachedResponses = async () => {
    try {
      const cached = await AsyncStorage.getItem('chatCache');
      if (cached) {
        setCachedResponses(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Error loading cached responses:', error);
    }
  };

  const saveToChatCache = async (query, response) => {
    try {
      const newCache = {
        ...cachedResponses,
        [query.toLowerCase().trim()]: {
          response,
          timestamp: Date.now()
        }
      };
      
      // Keep only last 50 cached responses
      const entries = Object.entries(newCache);
      if (entries.length > 50) {
        const sorted = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        const trimmed = Object.fromEntries(sorted.slice(0, 50));
        setCachedResponses(trimmed);
        await AsyncStorage.setItem('chatCache', JSON.stringify(trimmed));
      } else {
        setCachedResponses(newCache);
        await AsyncStorage.setItem('chatCache', JSON.stringify(newCache));
      }
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const getCachedResponse = (query) => {
    const cached = cachedResponses[query.toLowerCase().trim()];
    if (cached) {
      const age = Date.now() - cached.timestamp;
      const oneHour = 60 * 60 * 1000;
      if (age < oneHour) {
        return cached.response;
      }
    }
    return null;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    
    // Check cache first
    const cachedResponse = getCachedResponse(userMessage);
    if (cachedResponse) {
      setMessages([...newMessages, { role: 'assistant', content: cachedResponse }]);
      scrollViewRef.current?.scrollToEnd({ animated: true });
      return;
    }
    
    setLoading(true);
    setStreamingMessage('');
    setIsStreaming(true);
    
    try {
      let result;
      let fullResponse;

      // Use form-aware AI if mode is active
      if (isFormAwareMode && formContextStatus?.isActive) {
        console.log('🎯 Using form-aware AI coaching...');
        
        result = await aiService.chatWithFormContext(
          userMessage,
          newMessages.slice(-10), // Last 10 messages for context
          {
            includeFormContext: true,
            exerciseType: formContextStatus.currentExercise,
            formAnalysisData: formAnalysisData,
            coachingStyle: formContextStatus.coachingStyle,
            contextType: 'focused',
          }
        );
        
        fullResponse = result.response || '';
        
        // Note: Form-specific metadata will be handled in the final message addition below
        
      } else {
        // Fallback to regular enhanced chat
        console.log('💬 Using regular AI chat...');
        
        // Prepare context-enhanced prompt
        const enhancedPrompt = await prepareEnhancedPrompt(userMessage, newMessages);
        
        // Use Firebase callable function for chat
        const chatFunction = httpsCallable(functions, 'chatWithGemini');
        
        // Call the function with enhanced context
        const chatResult = await chatFunction({
          message: enhancedPrompt,
          context: userContext,
          history: newMessages.slice(-10),
        });
        
        fullResponse = chatResult.data?.response || chatResult.data || '';
      }
      
      // Show the response immediately (no streaming for now)
      setStreamingMessage(fullResponse);
      scrollViewRef.current?.scrollToEnd({ animated: true });
      
      // Process structured response if it contains workout data
      const structuredData = extractStructuredData(fullResponse);
      if (structuredData) {
        setGeneratedPlan(structuredData);
        await saveGeneratedPlan(structuredData);
      }
      
      // Save to cache
      await saveToChatCache(userMessage, fullResponse);
      
      // Add complete response to messages with form context metadata if available
      const finalMessage = { 
        role: 'assistant', 
        content: fullResponse,
        ...(result?.formContextUsed && {
          formMetrics: result.formMetrics,
          coachingInsights: result.coachingInsights,
          formContextUsed: true,
        })
      };
      
      setMessages(prev => [...prev, finalMessage]);
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error.message || 'Failed to get response';
      Alert.alert('Chat Error', `Error: HTTP error! status: 500`);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Sorry, I encountered an error: ${errorMessage}\n\nPlease try again or check your connection.` 
      }]);
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const prepareEnhancedPrompt = async (userMessage, history) => {
    const context = userContext || await contextAggregator.getContext();
    
    let enhancedPrompt = userMessage;
    
    // Add relevant context based on message content
    if (userMessage.toLowerCase().includes('workout') || 
        userMessage.toLowerCase().includes('program') ||
        userMessage.toLowerCase().includes('plan')) {
      
      enhancedPrompt += `\n\n[Context - Do not display to user]:`;
      enhancedPrompt += `\nUser Profile: ${JSON.stringify(context.user)}`;
      enhancedPrompt += `\nRecent Workouts: ${context.workoutHistory?.stats?.totalWorkouts || 0} in last 30 days`;
      enhancedPrompt += `\nPerformance Level: ${context.performance?.strengthLevel}`;
      enhancedPrompt += `\nEquipment Available: ${context.preferences?.equipment?.join(', ')}`;
      
      if (context.user?.injuries) {
        enhancedPrompt += `\nInjuries/Limitations: ${context.user.injuries}`;
      }
      
      if (context.insights) {
        enhancedPrompt += `\nInsights: ${JSON.stringify(context.insights)}`;
      }
      
      if (context.recommendations?.workoutFocus?.length > 0) {
        enhancedPrompt += `\nRecommendations: ${context.recommendations.workoutFocus.join('; ')}`;
      }
    }
    
    if (userMessage.toLowerCase().includes('nutrition') || 
        userMessage.toLowerCase().includes('diet') ||
        userMessage.toLowerCase().includes('meal')) {
      
      enhancedPrompt += `\n\n[Nutrition Context]:`;
      enhancedPrompt += `\nDaily Averages: ${JSON.stringify(context.nutrition?.dailyAverages)}`;
      enhancedPrompt += `\nCompliance: ${Math.round((context.nutrition?.compliance || 0) * 100)}%`;
      
      if (context.recommendations?.nutritionFocus?.length > 0) {
        enhancedPrompt += `\nNutrition Recommendations: ${context.recommendations.nutritionFocus.join('; ')}`;
      }
    }
    
    return enhancedPrompt;
  };

  const extractStructuredData = (response) => {
    try {
      // Look for JSON structure in the response
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // Look for structured workout format
      if (response.includes('Day 1:') || response.includes('Monday:')) {
        return parseWorkoutFromText(response);
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting structured data:', error);
      return null;
    }
  };

  const parseWorkoutFromText = (text) => {
    // Parse workout text into structured format
    const lines = text.split('\n');
    const workout = {
      weeklyDietPlan: {},
      dailyPlans: []
    };
    
    let currentDay = null;
    let currentSection = null;
    
    lines.forEach(line => {
      if (line.match(/^(Day \d+|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):/i)) {
        if (currentDay) {
          workout.dailyPlans.push(currentDay);
        }
        currentDay = {
          day: line.split(':')[0].trim(),
          title: line.split(':')[1]?.trim() || '',
          workout: [],
          mealPlan: {}
        };
        currentSection = 'workout';
      } else if (currentDay && line.includes('Exercise:')) {
        // Parse exercise line
        const exercise = {
          exercise: line.replace('Exercise:', '').trim(),
          sets: 3,
          reps: '10-12',
          rpe: 7
        };
        currentDay.workout.push(exercise);
      }
    });
    
    if (currentDay) {
      workout.dailyPlans.push(currentDay);
    }
    
    return workout.dailyPlans.length > 0 ? workout : null;
  };

  const saveGeneratedPlan = async (plan) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const workoutDoc = {
        userId: user.uid,
        plan: plan,
        createdAt: new Date().toISOString(),
        context: {
          userLevel: userContext?.user?.experienceLevel,
          goals: userContext?.user?.fitnessGoals,
          equipment: userContext?.preferences?.equipment
        },
        metadata: {
          source: 'context-aware-generator',
          version: '2.0'
        }
      };
      
      const docRef = await addDoc(collection(db, 'generatedWorkouts'), workoutDoc);
      
      // Also save to user's workouts collection
      await setDoc(doc(db, 'users', user.uid, 'workouts', docRef.id), workoutDoc);
      
      // Sync to health service if enabled
      if (healthService.isInitialized) {
        await healthService.syncWorkout({
          id: docRef.id,
          name: plan.dailyPlans[0]?.title || 'Generated Workout',
          completedAt: new Date().toISOString(),
          duration: 45, // Default duration
          exercises: plan.dailyPlans[0]?.workout || []
        });
      }
      
      Alert.alert('Success', 'Workout plan saved successfully!');
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout plan');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh context
      const newContext = await contextAggregator.getContext(true);
      setUserContext(newContext);
      
      // Update greeting
      const greeting = generatePersonalizedGreeting(newContext);
      setMessages([{ role: 'assistant', content: greeting }]);
      
    } catch (error) {
      console.error('Error refreshing context:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderContextPanel = () => {
    if (!userContext || !showContextPanel) return null;
    
    return (
      <Animated.View style={[styles.contextPanel, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.contextContent}>
          {/* Form Context Status */}
          {isFormAwareMode && formContextStatus && (
            <>
              <View style={styles.contextRow}>
                <Text style={[styles.contextLabel, { color: '#FFB86B' }]}>Form Mode:</Text>
                <Text style={[styles.contextValue, { color: '#00F0FF' }]}>
                  {formContextStatus.currentExercise || 'Active'}
                </Text>
              </View>
              
              {formAnalysisData?.overallScore && (
                <View style={styles.contextRow}>
                  <Text style={styles.contextLabel}>Form Score:</Text>
                  <Text style={styles.contextValue}>
                    {Math.round(formAnalysisData.overallScore)}/100
                  </Text>
                </View>
              )}
              
              <View style={styles.contextRow}>
                <Text style={styles.contextLabel}>Coaching Style:</Text>
                <Text style={styles.contextValue}>
                  {formContextStatus.coachingStyle || 'Supportive'}
                </Text>
              </View>
              
              <View style={[styles.contextRow, { borderBottomWidth: 1, borderBottomColor: '#2A2B2E', paddingBottom: 8, marginBottom: 8 }]} />
            </>
          )}
          
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Level:</Text>
            <Text style={styles.contextValue}>
              {userContext.user?.experienceLevel || 'Not set'}
            </Text>
          </View>
          
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Consistency:</Text>
            <Text style={styles.contextValue}>
              {Math.round((userContext.performance?.consistency || 0) * 100)}%
            </Text>
          </View>
          
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Progress:</Text>
            <Text style={styles.contextValue}>
              {Math.round(userContext.performance?.overallProgress || 0)}%
            </Text>
          </View>
          
          {userContext.health?.isConnected && (
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Today's Steps:</Text>
              <Text style={styles.contextValue}>
                {userContext.health.today?.steps?.toLocaleString() || '0'}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };


  if (contextLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB86B" />
        <Text style={styles.loadingText}>Loading your personalized experience...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0B0D', '#1A1B1E']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Global Context Status Line */}
      <GlobalContextStatusLine navigation={navigation} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {isFormAwareMode && (
            <View style={styles.formModeIndicator}>
              <Ionicons name="analytics" size={16} color="#00F0FF" />
              <Text style={styles.formModeText}>Form-Aware</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.headerTitle}>GENERATOR</Text>
        
        <TouchableOpacity 
          onPress={() => setShowContextPanel(!showContextPanel)}
          style={styles.contextToggle}
        >
          <Ionicons 
            name={showContextPanel ? 'information-circle' : 'information-circle-outline'} 
            size={24} 
            color="#FFB86B" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Context Panel */}
      {renderContextPanel()}
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        
        {/* Main Content */}        
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFB86B"
            />
          }
        >
          {/* Form-Aware Coaching Card */}
          {isFormAwareMode && (
            <FormAwareCoachingCard
              formMetrics={formAnalysisData ? {
                overallScore: formAnalysisData.overallScore || formAnalysisData.score || 0,
                keyErrors: formAnalysisData.criticalErrors || formAnalysisData.errors || [],
                improvements: formAnalysisData.improvements || [],
                timestamp: formAnalysisData.timestamp || new Date().toISOString(),
              } : null}
              coachingInsights={messages.length > 0 ? 
                messages[messages.length - 1]?.coachingInsights : null}
              isActive={formContextStatus?.isActive}
              exerciseType={formContextStatus?.currentExercise}
              coachingStyle={formContextStatus?.coachingStyle || 'supportive'}
              onAdjustSettings={() => {
                // TODO: Navigate to form coaching settings
                console.log('Adjust form coaching settings');
              }}
            />
          )}

          {/* Progress Integration Widget */}
          {showProgressWidget && (
            <ProgressIntegrationWidget
              formProgressData={formProgressData}
              aiRecommendations={aiRecommendations}
              exerciseType={formContextStatus?.currentExercise}
              timeRange="30d"
              onViewFullProgress={() => {
                // TODO: Navigate to full progress view
                console.log('View full progress');
              }}
              onApplyRecommendation={(type, recommendation) => {
                console.log('Apply recommendation:', type, recommendation);
                // TODO: Apply recommendation to workout or training plan
              }}
            />
          )}

          {messages.map((message, index) => (
            <Animated.View
              key={index}
              style={[
                styles.messageWrapper,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                { opacity: fadeAnim }
              ]}
            >
              {message.role === 'assistant' && (
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={['#FFB86B', '#FF7E87']}
                    style={styles.avatar}
                  >
                    <Ionicons name="fitness" size={16} color="#FFF" />
                  </LinearGradient>
                </View>
              )}
              
              <View style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.assistantBubble
              ]}>
                {message.role === 'assistant' ? (
                  <MarkdownRenderer content={message.content.replace(/Browse.*?Profile/gs, '').replace(/\n\n+/g, '\n\n')} />
                ) : (
                  <Text style={styles.messageText}>{message.content}</Text>
                )}

                {/* Show form context indicator on AI messages that used form context */}
                {message.role === 'assistant' && message.formContextUsed && (
                  <View style={styles.formContextIndicator}>
                    <Ionicons name="analytics" size={12} color="#00F0FF" />
                    <Text style={styles.formContextText}>Form-aware response</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          ))}
          
          {isStreaming && streamingMessage && (
            <View style={[styles.messageWrapper, styles.assistantMessage]}>
              <View style={styles.avatarContainer}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <LinearGradient
                    colors={['#FFB86B', '#FF7E87']}
                    style={styles.avatar}
                  >
                    <Ionicons name="fitness" size={16} color="#FFF" />
                  </LinearGradient>
                </Animated.View>
              </View>
              
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <MarkdownRenderer content={streamingMessage} />
              </View>
            </View>
          )}
          
          {loading && !isStreaming && (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#FFB86B" />
              <Text style={styles.typingText}>AI is thinking...</Text>
            </View>
          )}
        </ScrollView>
        
        {/* Input Area */}        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything about fitness..."
            placeholderTextColor="#666"
            multiline
            maxHeight={100}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={loading || !input.trim()}
          >
            <LinearGradient
              colors={loading ? ['#666', '#555'] : ['#FFB86B', '#FF7E87']}
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 65 : 55, // Account for tab bar height
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0B0D',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 10,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2E',
    position: 'relative',
  },
  headerLeft: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  formModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F0FF20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00F0FF40',
  },
  formModeText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#00F0FF',
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: '#00F0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    fontFamily: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif',
    }),
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
    padding: 5,
  },
  contextToggle: {
    position: 'absolute',
    right: 20,
    padding: 5,
  },
  contextPanel: {
    backgroundColor: '#1A1B1E',
    marginHorizontal: 15,
    marginTop: 5,
    marginBottom: 5,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2B2E',
  },
  contextContent: {
    padding: 10,
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  contextValue: {
    fontSize: 13,
    color: '#F8F9FA',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
  },
  messageWrapper: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#FFB86B',
  },
  assistantBubble: {
    backgroundColor: '#1A1B1E',
    borderWidth: 1,
    borderColor: '#2A2B2E',
  },
  messageText: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 20,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 42,
    paddingVertical: 10,
  },
  typingText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    borderTopWidth: 1,
    borderTopColor: '#2A2B2E',
    alignItems: 'flex-end',
    backgroundColor: '#0A0B0D',
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1B1E',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    color: '#F8F9FA',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A2B2E',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  formContextText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
});