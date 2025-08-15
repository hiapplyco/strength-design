import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYSTEM_PROMPT = `You are an elite fitness coach and movement specialist. Your approach is:

1. PERSONALIZED: Tailor every response to the user's specific context, history, and goals
2. INTELLIGENT: Ask insightful questions that reveal deeper needs and preferences
3. PROGRESSIVE: Build understanding gradually through natural conversation
4. SCIENTIFIC: Base recommendations on exercise science and biomechanics
5. ENCOURAGING: Maintain a positive, supportive tone while being realistic

When you have user context (previous workouts, preferences, etc.), acknowledge it and build upon it.
When context is minimal, focus on understanding their story first.

Track information gathering progress:
- Basic info (fitness level, experience): 20%
- Primary goals and motivations: 40%
- Schedule and time availability: 60%
- Equipment and environment: 75%
- Limitations and preferences: 85%
- Ready for detailed program: 100%

Always be specific. If someone mentions yoga, ask about their practice. If they mention injuries, understand the specifics.`;

export default function EnhancedAIWorkoutChat({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [userContext, setUserContext] = useState(null);
  const [collectedInfo, setCollectedInfo] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Animation refs
  const scrollViewRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;
  const charAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserContext();
  }, []);

  useEffect(() => {
    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    // Streaming pulse animation
    if (isStreaming) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isStreaming]);

  useEffect(() => {
    // Typing dots animation
    if (isStreaming && !streamingMessage) {
      const animateTypingDots = () => {
        const createDotAnimation = (dot, delay) => {
          return Animated.loop(
            Animated.sequence([
              Animated.delay(delay),
              Animated.timing(dot, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(dot, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ])
          );
        };

        Animated.parallel([
          createDotAnimation(typingDot1, 0),
          createDotAnimation(typingDot2, 200),
          createDotAnimation(typingDot3, 400),
        ]).start();
      };

      animateTypingDots();
    }
  }, [isStreaming, streamingMessage]);

  const loadUserContext = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        initializeChat(null);
        return;
      }

      // Load user profile and history
      const context = {
        userId: user.uid,
        email: user.email,
        previousWorkouts: [],
        preferences: {},
        stats: {}
      };

      // Get user's previous workouts
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const workoutsSnapshot = await getDocs(workoutsQuery);
      workoutsSnapshot.forEach(doc => {
        context.previousWorkouts.push(doc.data());
      });

      // Get user preferences from AsyncStorage
      const savedPreferences = await AsyncStorage.getItem('userPreferences');
      if (savedPreferences) {
        context.preferences = JSON.parse(savedPreferences);
      }

      // Get workout stats
      const statsQuery = query(
        collection(db, 'dailyWorkouts'),
        where('userId', '==', user.uid),
        where('completed', '==', true)
      );
      
      const statsSnapshot = await getDocs(statsQuery);
      context.stats.completedWorkouts = statsSnapshot.size;
      context.stats.streak = calculateStreak(statsSnapshot.docs);

      setUserContext(context);
      initializeChat(context);
    } catch (error) {
      console.error('Error loading context:', error);
      initializeChat(null);
    }
  };

  const calculateStreak = (workoutDocs) => {
    // Calculate current workout streak
    let streak = 0;
    const today = new Date();
    const sortedDocs = workoutDocs.sort((a, b) => 
      b.data().completedAt?.toDate() - a.data().completedAt?.toDate()
    );

    for (const doc of sortedDocs) {
      const completedDate = doc.data().completedAt?.toDate();
      if (!completedDate) continue;
      
      const daysDiff = Math.floor((today - completedDate) / (1000 * 60 * 60 * 24));
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const initializeChat = async (context) => {
    setIsInitializing(true);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      
      const functionsUrl = 'http://localhost:5001/demo-strength-design/us-central1';
      
      // Build context-aware initial prompt
      let initialPrompt = "You are starting a conversation with a user. ";
      
      if (context && context.previousWorkouts.length > 0) {
        initialPrompt += `This user has completed ${context.stats.completedWorkouts} workouts with us. `;
        if (context.stats.streak > 0) {
          initialPrompt += `They're on a ${context.stats.streak} day streak! `;
        }
        
        const lastWorkout = context.previousWorkouts[0];
        if (lastWorkout?.goals) {
          initialPrompt += `Their recent goals included: ${JSON.stringify(lastWorkout.goals)}. `;
        }
        
        initialPrompt += "Welcome them back warmly, acknowledge their progress, and ask how their fitness journey is going and what they'd like to work on today.";
      } else {
        initialPrompt += "This appears to be a new user or someone without recent workout history. Welcome them warmly and start by understanding their fitness background and current goals. Be conversational and encouraging.";
      }
      
      const response = await fetch(`${functionsUrl}/streamingChatEnhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: initialPrompt,
          systemPrompt: SYSTEM_PROMPT,
          context: context || { isNewUser: true },
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = '';
      let charIndex = 0;

      // Start character reveal animation
      const revealChars = () => {
        Animated.timing(charAnim, {
          toValue: 1,
          duration: 30 * fullResponse.length, // 30ms per character
          useNativeDriver: false,
        }).start();
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullResponse += parsed.text;
                // Animate text appearance
                setStreamingMessage(fullResponse);
              }
            } catch (e) {
              if (data && data !== '[DONE]') {
                fullResponse += data;
                setStreamingMessage(fullResponse);
              }
            }
          }
        }
      }

      setMessages([{ role: 'assistant', content: fullResponse }]);
      setStreamingMessage('');
      
    } catch (error) {
      console.error('Initialization error:', error);
      // Show clear message that API key is needed
      setMessages([{ 
        role: 'assistant', 
        content: "⚠️ Gemini AI is not connected.\n\nTo enable AI-powered workout generation:\n1. Get a FREE API key from Google AI Studio\n2. Follow the setup guide in SETUP_GEMINI.md\n3. Restart the Firebase emulators\n\nThis will give you real AI conversations powered by Gemini 2.5 Flash!" 
      }]);
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message with fade-in animation
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    
    // Start streaming
    setIsStreaming(true);
    setStreamingMessage('');
    
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      
      const functionsUrl = 'http://localhost:5001/demo-strength-design/us-central1';
      
      // Build comprehensive context
      const conversationContext = {
        userMessage,
        conversationHistory: newMessages,
        userContext: userContext || {},
        collectedInfo,
        progress,
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch(`${functionsUrl}/streamingChatEnhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: `User said: "${userMessage}". Progress: ${progress}%. Respond as a fitness coach, building on the conversation context.`,
          systemPrompt: SYSTEM_PROMPT,
          context: conversationContext,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullResponse += parsed.text;
                setStreamingMessage(fullResponse);
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }
            } catch (e) {
              if (data && data !== '[DONE]') {
                fullResponse += data;
                setStreamingMessage(fullResponse);
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }
            }
          }
        }
      }

      // Update progress based on conversation depth
      updateProgress(userMessage, fullResponse);
      
      // Add complete response
      setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
      
    } catch (error) {
      console.error('Chat error:', error);
      // Clear error message - API key needed
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "❌ Gemini API is not available. Please set up your API key to enable real AI conversations.\n\nSee SETUP_GEMINI.md for instructions."
      }]);
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const updateProgress = (userMessage, aiResponse) => {
    const lower = userMessage.toLowerCase();
    let newProgress = progress;
    
    if (lower.match(/beginner|intermediate|advanced|years?|months?/)) {
      newProgress = Math.max(newProgress, 20);
      setCollectedInfo(prev => ({ ...prev, experience: userMessage }));
    }
    if (lower.match(/goal|want|objective|achieve/)) {
      newProgress = Math.max(newProgress, 40);
      setCollectedInfo(prev => ({ ...prev, goals: userMessage }));
    }
    if (lower.match(/\d+\s*(days?|times?)/)) {
      newProgress = Math.max(newProgress, 60);
      setCollectedInfo(prev => ({ ...prev, frequency: userMessage }));
    }
    if (lower.match(/equipment|gym|home|space/)) {
      newProgress = Math.max(newProgress, 75);
      setCollectedInfo(prev => ({ ...prev, equipment: userMessage }));
    }
    if (lower.match(/injury|limit|condition|prefer/)) {
      newProgress = Math.max(newProgress, 85);
      setCollectedInfo(prev => ({ ...prev, limitations: userMessage }));
    }
    
    setProgress(newProgress);
  };

  const generateWorkout = async () => {
    if (progress < 60) {
      Alert.alert('More Info Needed', 'Let me ask a few more questions to create the best workout for you.');
      return;
    }

    setIsGenerating(true);
    setProgress(100);

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      
      const functionsUrl = 'http://localhost:5001/demo-strength-design/us-central1';
      
      const response = await fetch(`${functionsUrl}/generateWorkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          goals: collectedInfo,
          context: userContext,
          conversation: messages,
          userId: user?.uid,
        }),
      });

      const result = await response.json();
      
      // Save to Firestore
      await addDoc(collection(db, 'workouts'), {
        userId: user?.uid,
        ...result.data,
        goals: collectedInfo,
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        '🎉 Workout Generated!',
        'Your personalized workout plan is ready!',
        [{ text: 'View Workouts', onPress: () => navigation.navigate('Workouts') }]
      );

    } catch (error) {
      console.error('Generation error:', error);
      
      // Generate a fallback workout when API is unavailable
      const fallbackWorkout = {
        userId: auth.currentUser?.uid,
        name: 'AI-Generated Workout',
        description: 'Custom workout based on your preferences',
        exercises: [
          { name: 'Warm-up: Dynamic Stretching', sets: 1, reps: '5 min', equipment: 'None' },
          { name: 'Push-ups', sets: 3, reps: 12, equipment: 'Bodyweight' },
          { name: 'Bodyweight Squats', sets: 3, reps: 15, equipment: 'Bodyweight' },
          { name: 'Plank Hold', sets: 3, reps: '45 sec', equipment: 'None' },
          { name: 'Lunges', sets: 3, reps: '10 each', equipment: 'Bodyweight' },
          { name: 'Mountain Climbers', sets: 3, reps: 20, equipment: 'Bodyweight' },
          { name: 'Cool-down: Static Stretching', sets: 1, reps: '5 min', equipment: 'None' }
        ],
        difficulty: progress > 80 ? 'Advanced' : progress > 50 ? 'Intermediate' : 'Beginner',
        duration: '30-45 minutes',
        goals: collectedInfo,
        createdAt: serverTimestamp(),
      };
      
      // Save the fallback workout
      try {
        await addDoc(collection(db, 'workouts'), fallbackWorkout);
        Alert.alert(
          '✅ Workout Created!',
          'I\'ve created a starter workout based on our conversation. You can customize it in the Workouts tab!',
          [{ text: 'View Workouts', onPress: () => navigation.navigate('Workouts') }]
        );
      } catch (saveError) {
        console.error('Failed to save workout:', saveError);
        Alert.alert('Note', 'Generated workout but couldn\'t save. Please check your connection.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
          { opacity: fadeAnim }
        ]}
      >
        {!isUser && (
          <Animated.View style={{ transform: [{ scale: isStreaming && index === messages.length - 1 ? pulseAnim : 1 }] }}>
            <LinearGradient
              colors={['#FF7E87', '#FFB86B']}
              style={styles.avatar}
            >
              <Ionicons name="fitness" size={20} color="#FFF" />
            </LinearGradient>
          </Animated.View>
        )}
        
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {message.content}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderStreamingMessage = () => {
    if (!isStreaming || !streamingMessage) return null;
    
    return (
      <Animated.View style={[styles.messageContainer, styles.assistantMessageContainer]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={['#FF7E87', '#FFB86B']}
            style={styles.avatar}
          >
            <Ionicons name="fitness" size={20} color="#FFF" />
          </LinearGradient>
        </Animated.View>
        
        <View style={[styles.messageBubble, styles.assistantBubble]}>
          <Text style={styles.messageText}>{streamingMessage}</Text>
        </View>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isStreaming || streamingMessage) return null;
    
    return (
      <View style={styles.typingContainer}>
        <LinearGradient
          colors={['#FF7E87', '#FFB86B']}
          style={styles.avatar}
        >
          <Ionicons name="fitness" size={20} color="#FFF" />
        </LinearGradient>
        
        <View style={styles.typingBubble}>
          <Animated.View style={[styles.typingDot, { opacity: typingDot1 }]} />
          <Animated.View style={[styles.typingDot, { opacity: typingDot2 }]} />
          <Animated.View style={[styles.typingDot, { opacity: typingDot3 }]} />
        </View>
      </View>
    );
  };

  const renderContextBar = () => {
    if (!userContext || Object.keys(collectedInfo).length === 0) return null;
    
    return (
      <ScrollView 
        horizontal 
        style={styles.contextBar}
        showsHorizontalScrollIndicator={false}
      >
        {userContext?.stats?.streak > 0 && (
          <View style={styles.contextChip}>
            <Ionicons name="flame" size={14} color="#FF6B35" />
            <Text style={styles.contextChipText}>{userContext.stats.streak} day streak</Text>
          </View>
        )}
        
        {Object.entries(collectedInfo).map(([key, value]) => (
          <View key={key} style={styles.contextChip}>
            <Text style={styles.contextChipLabel}>{key}</Text>
            <Text style={styles.contextChipValue} numberOfLines={1}>{value}</Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={['#FF7E87', '#FFB86B']}
            style={styles.loadingAvatar}
          >
            <Ionicons name="fitness" size={40} color="#FFF" />
          </LinearGradient>
        </Animated.View>
        <Text style={styles.loadingText}>Preparing your AI coach...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient
        colors={['#1A1A1E', '#2C2C3E']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Workout Coach</Text>
          <TouchableOpacity 
            style={[styles.generateButton, progress >= 60 && styles.generateButtonActive]}
            onPress={generateWorkout}
            disabled={isGenerating || progress < 60}
          >
            <LinearGradient
              colors={progress >= 60 ? ['#4CAF50', '#45B049'] : ['#666', '#555']}
              style={styles.generateButtonGradient}
            >
              <Text style={styles.generateButtonText}>
                {isGenerating ? 'Creating...' : progress >= 60 ? 'Generate' : `${60 - progress}% more`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  })
                }
              ]}
            >
              <LinearGradient
                colors={['#FFB86B', '#FF7E87']}
                style={styles.progressGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
          <Text style={styles.progressText}>
            {progress}% Complete - {progress === 0 ? 'Getting started' : progress < 60 ? 'Gathering information' : 'Ready to generate'}
          </Text>
        </View>
        
        {/* Context Bar */}
        {renderContextBar()}
      </LinearGradient>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
        {renderStreamingMessage()}
        {renderTypingIndicator()}
        
        {isGenerating && (
          <View style={styles.generatingContainer}>
            <ActivityIndicator size="large" color="#FFB86B" />
            <Text style={styles.generatingText}>Creating your personalized workout plan...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your answer or ask questions..."
          placeholderTextColor="#666"
          multiline
          maxHeight={100}
          editable={!isStreaming && !isGenerating}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || isStreaming || isGenerating) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || isStreaming || isGenerating}
        >
          <LinearGradient
            colors={input.trim() && !isStreaming && !isGenerating ? ['#FF7E87', '#FFB86B'] : ['#333', '#444']}
            style={styles.sendButtonGradient}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0C',
  },
  loadingAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: '#FFB86B',
    fontSize: 16,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  generateButton: {
    borderRadius: 20,
    opacity: 0.5,
  },
  generateButtonActive: {
    opacity: 1,
  },
  generateButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressGradient: {
    flex: 1,
  },
  progressText: {
    color: '#FFF',
    fontSize: 12,
    opacity: 0.7,
  },
  contextBar: {
    paddingHorizontal: 20,
    maxHeight: 40,
    marginBottom: 8,
  },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 107, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 107, 0.3)',
  },
  contextChipText: {
    color: '#FFB86B',
    fontSize: 12,
    marginLeft: 4,
  },
  contextChipLabel: {
    color: '#FFB86B',
    fontSize: 10,
    opacity: 0.8,
    marginRight: 4,
  },
  contextChipValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 100,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#FFB86B',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#1C1C1E',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#FFF',
  },
  userMessageText: {
    color: '#000',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB86B',
    marginHorizontal: 2,
  },
  generatingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  generatingText: {
    marginTop: 16,
    color: '#FFB86B',
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0A0A0C',
  },
  input: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    color: '#FFF',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});