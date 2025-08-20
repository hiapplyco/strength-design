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
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { functions, db, auth } from '../firebaseConfig';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import contextAggregator from '../services/contextAggregator';
import healthService from '../services/healthService';
import MarkdownRenderer from '../components/MarkdownRenderer';
import DailyWorkoutCard from '../components/DailyWorkoutCard';

const { width: screenWidth } = Dimensions.get('window');

export default function ContextAwareGeneratorScreen({ navigation, route }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [userContext, setUserContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [viewMode, setViewMode] = useState('chat'); // 'chat', 'preview', 'cards'
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cachedResponses, setCachedResponses] = useState({});
  const [selectedDay, setSelectedDay] = useState(0);
  const [programContext, setProgramContext] = useState(null);
  
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check for program context from navigation
    if (route?.params?.programContext) {
      setProgramContext(route.params.programContext);
    }
    
    initializeChat();
    loadCachedResponses();
  }, [route?.params]);

  const initializeChat = async () => {
    try {
      setContextLoading(true);
      
      // Load user context with program context if available
      const context = await contextAggregator.getContext();
      const contextWithProgram = contextAggregator.buildContext(programContext);
      setUserContext(contextWithProgram);
      
      // Generate personalized greeting
      const greeting = generatePersonalizedGreeting(contextWithProgram, programContext);
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

  const generatePersonalizedGreeting = (context, programContext = null) => {
    const { user, workoutHistory, health, insights, recommendations, selectedProgram, programInsights } = context;
    
    let greeting = `👋 **Welcome back, ${user?.displayName || 'there'}!**\n\n`;
    
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
    
    greeting += `**How can I help you today?**\n`;
    greeting += `• Generate a new workout plan\n`;
    greeting += `• Adjust your current program\n`;
    greeting += `• Get nutrition guidance\n`;
    greeting += `• Review your progress\n`;
    
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
      // Prepare context-enhanced prompt
      const enhancedPrompt = await prepareEnhancedPrompt(userMessage, newMessages);
      
      // Call streaming chat function
      // Use emulator URL in development with demo project
      const functionsUrl = 'http://localhost:5001/demo-strength-design/us-central1';
      
      // Get auth token
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      
      const response = await fetch(`${functionsUrl}/streamingChatEnhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: enhancedPrompt,
          context: userContext,
          history: newMessages.slice(-10), // Last 10 messages for context
        }),
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process SSE format
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullResponse += parsed.text;
                setStreamingMessage(fullResponse);
                // Auto-scroll to bottom
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }
            } catch (e) {
              // Not JSON, treat as plain text
              fullResponse += data;
              setStreamingMessage(fullResponse);
            }
          }
        }
      }
      
      // Process structured response if it contains workout data
      const structuredData = extractStructuredData(fullResponse);
      if (structuredData) {
        setGeneratedPlan(structuredData);
        await saveGeneratedPlan(structuredData);
      }
      
      // Save to cache
      await saveToChatCache(userMessage, fullResponse);
      
      // Add complete response to messages
      setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
      
    } catch (error) {
      console.error('Error in chat:', error);
      Alert.alert('Error', 'Failed to get response. Please try again.');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again or check your connection.' 
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
    if (!userContext) return null;
    
    return (
      <Animated.View style={[styles.contextPanel, { transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity 
          style={styles.contextHeader}
          onPress={() => setShowContextPanel(!showContextPanel)}
        >
          <Text style={styles.contextTitle}>Your Context</Text>
          <Ionicons 
            name={showContextPanel ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#FFB86B" 
          />
        </TouchableOpacity>
        
        {showContextPanel && (
          <View style={styles.contextContent}>
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
            
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Recovery:</Text>
              <Text style={styles.contextValue}>
                {userContext.performance?.recoveryScore || 0}/100
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
        )}
      </Animated.View>
    );
  };

  const renderWorkoutCards = () => {
    if (!generatedPlan || !generatedPlan.dailyPlans) return null;
    
    return (
      <ScrollView 
        horizontal 
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.cardsContainer}
      >
        {generatedPlan.dailyPlans.map((day, index) => (
          <View key={index} style={styles.cardWrapper}>
            <DailyWorkoutCard
              day={day}
              dayIndex={index}
              onComplete={async (workoutData) => {
                // Save completed workout
                await healthService.syncWorkout(workoutData);
                Alert.alert('Great job!', 'Workout completed and synced!');
              }}
              onSchedule={() => {
                // Handle scheduling
                navigation.navigate('Schedule', { workout: day });
              }}
            />
          </View>
        ))}
      </ScrollView>
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0A0B0D', '#1A1B1E']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#F8F9FA" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>AI Coach</Text>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setViewMode(viewMode === 'cards' ? 'chat' : 'cards')}
              style={styles.headerButton}
            >
              <Ionicons 
                name={viewMode === 'cards' ? 'chatbubbles' : 'albums'} 
                size={24} 
                color="#FFB86B" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onRefresh}
              style={styles.headerButton}
            >
              <Ionicons name="refresh" size={24} color="#FFB86B" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Context Panel */}
        {renderContextPanel()}
        
        {/* Main Content */}
        {viewMode === 'chat' ? (
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
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <Text style={styles.messageText}>{message.content}</Text>
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
        ) : (
          renderWorkoutCards()
        )}
        
        {/* Input Area */}
        {viewMode === 'chat' && (
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
        )}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2E',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8F9FA',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
    padding: 5,
  },
  contextPanel: {
    backgroundColor: '#1A1B1E',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2B2E',
  },
  contextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  contextTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB86B',
  },
  contextContent: {
    paddingHorizontal: 15,
    paddingBottom: 15,
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
    paddingVertical: 20,
  },
  messageWrapper: {
    marginBottom: 15,
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
  cardsContainer: {
    flex: 1,
  },
  cardWrapper: {
    width: screenWidth - 30,
    paddingHorizontal: 15,
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
});