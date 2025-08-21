import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient } from '../components/SafeLinearGradient';
import { useTheme, themedStyles } from '../contexts/ThemeContext';
import { GlassCard, GlassContainer } from '../components/GlassmorphismComponents';
import { auth, db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFunctionsUrl, FUNCTION_URLS } from '../config/firebase';
import { colors } from '../utils/designTokens';
import MarkdownRenderer from '../components/MarkdownRenderer';
import chatSessionService from '../services/chatSessionService';
import { STRUCTURED_WORKOUT_PROMPT } from '../prompts/structuredWorkoutPrompt';
import ContextModal from '../components/ContextModal';
import WorkoutVideoRecorderAI from '../components/WorkoutVideoRecorderAI';

const SYSTEM_PROMPT = `You are Coach Alex, an elite fitness coach with 15+ years of experience helping people transform their lives through movement. Your personality is warm, encouraging, and scientifically-minded.

## Your Core Personality:
- **Enthusiastic but never overwhelming** - You genuinely care about each person's journey
- **Knowledgeable yet accessible** - You translate complex exercise science into simple, actionable advice
- **Adaptive communicator** - You match your tone to the user's experience level and energy
- **Motivational realist** - You inspire while being honest about what's achievable
- **Curious listener** - You ask thoughtful follow-up questions that show you're paying attention

## Your Communication Style:
- Use encouraging language: "That's awesome!", "I love that you're thinking about...", "Great question!"
- Acknowledge effort and honesty: "Thanks for sharing that", "I appreciate you being upfront about..."
- Share relatable examples: "I had a client who...", "Many people find that..."
- Use fitness insider knowledge: Mention specific benefits, techniques, or progressions
- Be conversational, not clinical: "Let's figure this out together" vs. "Please provide information"

## Information Gathering Strategy:
**Stage 1 (0-20%): Breaking the Ice & Experience**
- Start with genuine interest in their fitness story
- Ask: "What's your relationship with fitness been like?" or "Tell me about your exercise background"
- Listen for: experience level, past successes/failures, current activity
- Follow up on specifics: "What did you love about [mentioned activity]?" "What made you stop [previous routine]?"

**Stage 2 (20-40%): Goals & Motivation Deep Dive**
- Explore the "why" behind their goals: "What would achieving [goal] mean to you?"
- Ask about timeline and priority: "If you could only improve one thing in the next 3 months, what would it be?"
- Understand their vision: "Paint me a picture of your ideal fitness level"
- Listen for intrinsic vs. extrinsic motivations

**Stage 3 (40-60%): Lifestyle & Schedule Reality Check**
- Explore their daily rhythm: "Walk me through a typical day - when do you feel most energetic?"
- Ask about constraints: "What's your biggest challenge when it comes to working out?"
- Understand preferences: "Are you a morning person or do you prefer evening workouts?"
- Discuss realistic commitment: "How many days per week feels sustainable for you?"

**Stage 4 (60-75%): Equipment & Environment**
- Ask about their setup: "Where do you picture yourself working out most often?"
- Understand limitations: "What equipment do you have access to?" or "Do you prefer gym or home workouts?"
- Explore preferences: "Do you like the energy of a gym or the privacy of home workouts?"

**Stage 5 (75-85%): Safety & Preferences**
- Address limitations with care: "Are there any movements or areas we should be extra mindful of?"
- Understand dislikes: "What types of exercise have you tried and didn't enjoy?"
- Explore preferences: "Do you prefer strength training, cardio, or a mix?" "Any favorite ways to move your body?"

**Stage 6 (85-100%): Program Design & Readiness**
- Summarize what you've learned: "So based on our conversation, here's what I'm hearing..."
- Get final confirmation: "Does this sound like a program that would excite you?"
- Set expectations: "I'm thinking we start with [X] and build from there. How does that feel?"

## Advanced Coaching Techniques:
- **Mirror their language**: If they say "get in shape," use that phrase back
- **Build on their strengths**: "Since you already love hiking, we can use that as cardio"
- **Address concerns proactively**: "I know you mentioned being worried about time..."
- **Use progressive disclosure**: Share more advanced concepts as they show readiness
- **Create micro-commitments**: "Would you be willing to try this for just one week?"

## Knowledge Areas to Draw From:
- Exercise physiology and biomechanics
- Progressive overload and program design
- Injury prevention and movement quality
- Nutrition basics as they relate to performance
- Psychology of habit formation and motivation
- Equipment alternatives and modifications
- Time-efficient training methods

## Conversation Flow Management:
- If they're vague, ask for specifics: "When you say 'get stronger,' what would that look like day-to-day?"
- If they're hesitant, normalize concerns: "That's totally normal - a lot of people feel that way"
- If they're overwhelming you with info, summarize: "Wow, thanks for all that detail! Let me make sure I got the key points..."
- If they seem ready to move forward, validate and transition: "You've given me everything I need to create something amazing for you"

Remember: Your goal isn't just to collect information, but to build trust, understanding, and excitement for their fitness journey. Every question should feel like it's coming from genuine curiosity about helping them succeed.`;

export default function EnhancedAIWorkoutChat({ navigation, route }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [userContext, setUserContext] = useState(null);
  const [collectedInfo, setCollectedInfo] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentSession, setCurrentSession] = useState(null);
  const [showContextModal, setShowContextModal] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState(null);
  
  const theme = useTheme();
  
  // Animation refs
  const scrollViewRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;
  const charAnim = useRef(new Animated.Value(0)).current;
  const neonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start neon animation
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
    
    // Load user context first to determine welcome message
    loadUserContext();
    
    // Set a maximum time for initialization
    const initTimeout = setTimeout(() => {
      if (isInitializing) {
        console.log('Initialization timeout reached, forcing completion');
        setIsInitializing(false);
      }
    }, 3000); // 3 second maximum initialization time
    
    // Check if we have search context from navigation
    if (route?.params?.searchContext) {
      const { searchContext, message } = route.params;
      console.log('Received search context:', searchContext);
      
      // Add the context message to the chat
      if (message) {
        setMessages([{
          id: 'search-context-' + Date.now(),
          role: 'system',
          content: message,
          timestamp: new Date()
        }]);
      }
      
      // Store the search context
      if (searchContext) {
        setUserContext(prev => ({
          ...prev,
          searchContext: searchContext,
          hasSearchContext: true
        }));
      }
    }
    
    return () => clearTimeout(initTimeout);
  }, [route?.params]);
  
  // Initialize progress tracking based on existing user context
  useEffect(() => {
    if (userContext && userContext.preferences) {
      let initialProgress = 0;
      let initialInfo = { ...collectedInfo };
      
      // Check if we have existing user data to auto-populate progress
      if (userContext.preferences.fitnessLevel) {
        initialProgress = Math.max(initialProgress, 20);
        initialInfo.basicInfo = true;
        initialInfo.experience = userContext.preferences.fitnessLevel;
      }
      
      if (userContext.preferences.goals) {
        initialProgress = Math.max(initialProgress, 40);
        initialInfo.goals = true;
        initialInfo.primaryGoals = userContext.preferences.goals;
      }
      
      if (userContext.preferences.frequency) {
        initialProgress = Math.max(initialProgress, 60);
        initialInfo.schedule = true;
        initialInfo.timeAvailability = userContext.preferences.frequency;
      }
      
      if (userContext.preferences.equipment) {
        initialProgress = Math.max(initialProgress, 75);
        initialInfo.equipment = true;
        initialInfo.environmentEquipment = userContext.preferences.equipment;
      }
      
      if (userContext.preferences.injuries || userContext.preferences.preferences) {
        initialProgress = Math.max(initialProgress, 85);
        initialInfo.limitations = true;
        initialInfo.limitationsPreferences = userContext.preferences.injuries || userContext.preferences.preferences;
      }
      
      if (initialProgress > progress) {
        setProgress(initialProgress);
        setCollectedInfo(initialInfo);
        console.log('Initialized progress from user context:', { initialProgress, initialInfo });
      }
    }
  }, [userContext]);

  useEffect(() => {
    console.log('Messages state updated, total messages:', messages.length);
    messages.forEach((msg, index) => {
      console.log(`Message ${index}: ${msg.role} - ${msg.content?.substring(0, 50)}...`);
    });
    // Force re-render when messages change
    if (messages.length > 0 && isInitializing) {
      console.log('Messages loaded, stopping initialization');
      setIsInitializing(false);
    }
  }, [messages]);

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

      // Get user's previous workouts - simplified to avoid composite index
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('userId', '==', user.uid),
        limit(10)  // Get more to ensure we have recent ones after sorting
      );
      
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = [];
      workoutsSnapshot.forEach(doc => {
        workouts.push({ ...doc.data(), id: doc.id });
      });
      
      // Sort client-side to avoid composite index requirement
      workouts.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      
      // Take the 5 most recent
      context.previousWorkouts = workouts.slice(0, 5);

      // Get user preferences from AsyncStorage
      const savedPreferences = await AsyncStorage.getItem('userPreferences');
      if (savedPreferences) {
        context.preferences = JSON.parse(savedPreferences);
      }

      // Get workout stats - simplified query to avoid index requirement
      const statsQuery = query(
        collection(db, 'dailyWorkouts'),
        where('userId', '==', user.uid)
      );
      
      const statsSnapshot = await getDocs(statsQuery);
      // Filter completed workouts client-side
      const completedDocs = statsSnapshot.docs.filter(doc => doc.data().completed === true);
      context.stats.completedWorkouts = completedDocs.length;
      context.stats.streak = calculateStreak(completedDocs);

      setUserContext(context);
      
      // Create context-aware welcome message
      let welcomeMessage = "Welcome back! I'm your AI fitness coach. ";
      
      if (context.stats?.streak > 0) {
        welcomeMessage += `🔥 Amazing ${context.stats.streak} day streak! `;
      }
      
      if (context.previousWorkouts?.length > 0) {
        welcomeMessage += `I see you've completed ${context.stats.completedWorkouts} workouts. `;
        const lastWorkout = context.previousWorkouts[0];
        if (lastWorkout?.name) {
          welcomeMessage += `Your last workout was "${lastWorkout.name}". `;
        }
      }
      
      if (context.preferences?.fitnessLevel) {
        welcomeMessage += `\n\n📊 **Your Profile:**\n`;
        welcomeMessage += `• Fitness Level: ${context.preferences.fitnessLevel}\n`;
        if (context.preferences.goals) {
          welcomeMessage += `• Goals: ${context.preferences.goals}\n`;
        }
        if (context.preferences.equipment) {
          welcomeMessage += `• Equipment: ${context.preferences.equipment}\n`;
        }
        if (context.preferences.frequency) {
          welcomeMessage += `• Frequency: ${context.preferences.frequency} days/week\n`;
        }
      }
      
      welcomeMessage += "\n\nWhat would you like to work on today? I can:\n";
      welcomeMessage += "• Create a new workout plan\n";
      welcomeMessage += "• Modify your existing routine\n";
      welcomeMessage += "• Answer fitness questions\n";
      welcomeMessage += "• Help with nutrition planning";
      
      console.log('Setting initial welcome message:', welcomeMessage.substring(0, 100) + '...');
      const initialMessage = { role: 'assistant', content: welcomeMessage, timestamp: new Date() };
      setMessages([initialMessage]);
      setIsInitializing(false);
      console.log('Initial message set, isInitializing set to false');
    } catch (error) {
      console.error('Error loading context:', error);
      // Default welcome for new users or errors
      console.log('Setting fallback welcome message due to error:', error.message);
      const fallbackMessage = { 
        role: 'assistant', 
        content: "Welcome! I'm your AI fitness coach. Let's create a personalized workout plan for you.\n\nTell me about:\n• Your fitness goals\n• Current experience level\n• Available equipment\n• Time commitment",
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
      setIsInitializing(false);
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
    console.log('Initializing chat with context:', context);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Skip API call - just use the welcome message that was already set
    // The API call was causing unnecessary delays and errors
    console.log('Chat initialized with welcome message');
    setIsInitializing(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    console.log('Sending user message:', userMessage);
    setInput('');
    
    // Add user message with fade-in animation
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    console.log('Updated messages array with user message, total messages:', newMessages.length);
    
    // Start streaming
    setIsStreaming(true);
    setStreamingMessage('');
    
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      
      // Use the correct v2 function URL
      const functionsUrl = FUNCTION_URLS.enhancedChat;
      
      // Build comprehensive context
      const conversationContext = {
        userMessage,
        conversationHistory: newMessages,
        userContext: userContext || {},
        collectedInfo,
        progress,
        timestamp: new Date().toISOString()
      };
      
      // Add timeout to prevent infinite waiting
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for messages
      
      let response;
      try {
        response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            message: userMessage,
            history: newMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            sessionType: 'workout',
            uploadedFiles: [],
            useRAG: true,
            ragConfig: {
              maxChunks: 5,
              maxTokens: 4000,
              minRelevance: 0.5
            },
            userProfile: {
              fitnessLevel: userContext?.preferences?.fitnessLevel || collectedInfo.experience,
              goals: collectedInfo.primaryGoals ? [collectedInfo.primaryGoals] : [],
              equipment: collectedInfo.environmentEquipment ? [collectedInfo.environmentEquipment] : [],
              frequency: collectedInfo.timeAvailability,
              timePerSession: userContext?.preferences?.timePerSession,
              injuries: collectedInfo.limitationsPreferences || 'None mentioned',
              progress: progress,
              collectedInfo: collectedInfo
            },
          }),
          signal: controller.signal
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.log('Request timed out');
          throw new Error('Request timeout - please check your connection');
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      console.log('Enhanced chat response:', result);
      
      const fullResponse = result.response || '';
      const knowledgeSources = result.knowledgeSources || [];
      const ragMetadata = result.ragMetadata || null;
      
      // Simulate typing effect for better UX
      setStreamingMessage('');
      const words = fullResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        const partial = words.slice(0, i + 1).join(' ');
        setStreamingMessage(partial);
        await new Promise(resolve => setTimeout(resolve, 30)); // Typing speed
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }

      // Progress is updated before adding the message above
      
      // Update progress before adding response
      updateProgress(userMessage, fullResponse || '');
      
      // Add complete response with knowledge sources
      console.log('sendMessage - Final response length:', fullResponse.length);
      if (fullResponse.trim()) {
        console.log('sendMessage - Adding AI response to messages');
        const assistantMessage = { 
          role: 'assistant', 
          content: fullResponse,
          knowledgeSources: knowledgeSources,
          ragMetadata: ragMetadata,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        console.log('sendMessage - No AI response received');
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      // Show helpful error message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now, but don't worry! I can still help you plan your workout.\n\nLet me know what you're looking for - strength training, cardio, specific muscle groups, or something else - and I'll do my best to guide you!"
      }]);
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const updateProgress = (userMessage, aiResponse) => {
    const userLower = userMessage.toLowerCase();
    const aiLower = aiResponse.toLowerCase();
    let newProgress = progress;
    let newCollectedInfo = { ...collectedInfo };
    
    // Check what information has been collected based on user responses and AI questions
    
    // Stage 1: Basic info (fitness level, experience) - 20%
    if (!newCollectedInfo.basicInfo && (
      userLower.match(/beginner|intermediate|advanced|new to|started|years?|months?|first time|never|always|experienced/) ||
      userLower.match(/\d+\s*(year|month|week)/) ||
      aiLower.match(/fitness level|experience|how long|background/)
    )) {
      newProgress = Math.max(newProgress, 20);
      newCollectedInfo.basicInfo = true;
      newCollectedInfo.experience = userMessage;
    }
    
    // Stage 2: Primary goals and motivations - 40%
    if (!newCollectedInfo.goals && (
      userLower.match(/goal|want|lose|gain|build|strength|muscle|weight|tone|fit|healthy|marathon|compete/) ||
      userLower.match(/objective|achieve|improve|better|stronger|faster|leaner/) ||
      aiLower.match(/goals|what.*you.*want|motivat|why.*fitness/)
    )) {
      newProgress = Math.max(newProgress, 40);
      newCollectedInfo.goals = true;
      newCollectedInfo.primaryGoals = userMessage;
    }
    
    // Stage 3: Schedule and time availability - 60%
    if (!newCollectedInfo.schedule && (
      userLower.match(/\d+\s*(day|time|hour|minute|week|daily|weekly)/) ||
      userLower.match(/morning|evening|lunch|weekend|busy|schedule|available|free/) ||
      userLower.match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/) ||
      aiLower.match(/how often|schedule|time.*day|when.*work/)
    )) {
      newProgress = Math.max(newProgress, 60);
      newCollectedInfo.schedule = true;
      newCollectedInfo.timeAvailability = userMessage;
    }
    
    // Stage 4: Equipment and environment - 75%
    if (!newCollectedInfo.equipment && (
      userLower.match(/gym|home|equipment|weights|dumbbells|barbell|machine|bodyweight|none|outdoor/) ||
      userLower.match(/space|room|apartment|park|yard|membership|access/) ||
      aiLower.match(/equipment|where.*work|gym.*home|space.*exercise/)
    )) {
      newProgress = Math.max(newProgress, 75);
      newCollectedInfo.equipment = true;
      newCollectedInfo.environmentEquipment = userMessage;
    }
    
    // Stage 5: Limitations and preferences - 85%
    if (!newCollectedInfo.limitations && (
      userLower.match(/injury|hurt|pain|condition|limit|avoid|can't|cannot|difficult|problem/) ||
      userLower.match(/prefer|like|dislike|hate|enjoy|love|favorite|boring/) ||
      userLower.match(/knee|back|shoulder|ankle|wrist|hip|neck/) ||
      aiLower.match(/injur|limit|avoid|prefer|restrictions/)
    )) {
      newProgress = Math.max(newProgress, 85);
      newCollectedInfo.limitations = true;
      newCollectedInfo.limitationsPreferences = userMessage;
    }
    
    // Stage 6: Ready to generate - 100%
    if (newProgress >= 85 && (
      userLower.match(/ready|let's go|create|generate|make.*workout|sounds good|perfect/) ||
      userLower.match(/yes.*ready|start.*workout|begin/) ||
      aiLower.match(/ready.*create|enough.*information|let.*generate/)
    )) {
      newProgress = 100;
      newCollectedInfo.readyToGenerate = true;
    }
    
    setCollectedInfo(newCollectedInfo);
    setProgress(newProgress);
    
    console.log('Progress updated:', {
      oldProgress: progress,
      newProgress,
      collectedInfo: newCollectedInfo,
      userMessage: userMessage.substring(0, 50),
      aiResponse: aiResponse.substring(0, 50)
    });
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
      
      // Use the correct v2 function URL for generateStructuredWorkout
      const functionsUrl = FUNCTION_URLS.generateStructuredWorkout;
      
      // Create a comprehensive user profile from collected info
      const userProfile = {
        fitnessLevel: collectedInfo.fitnessLevel || 'intermediate',
        goals: collectedInfo.primaryGoals || ['strength', 'muscle'],
        equipment: collectedInfo.equipment || ['full_gym'],
        timePerSession: collectedInfo.sessionDuration || 45,
        daysPerWeek: collectedInfo.frequency || 4,
        restrictions: collectedInfo.limitations || [],
        preferences: collectedInfo.preferences || {},
      };
      
      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          goals: collectedInfo,
          context: userContext,
          conversation: messages,
          userProfile,
          systemPrompt: STRUCTURED_WORKOUT_PROMPT,
          userId: user?.uid,
        }),
      });

      const result = await response.json();
      console.log('Workout generation result:', result);
      
      // Handle different response structures
      const workoutData = result.program || result.workout || result;
      
      if (workoutData && (workoutData.weeks || workoutData.days || workoutData.exercises)) {
        // Save the structured workout to Firestore
        const workoutDoc = await addDoc(collection(db, 'structuredWorkouts'), {
          userId: user?.uid,
          program: workoutData,
          metadata: result.metadata || {},
          createdAt: serverTimestamp(),
        });
        
        // Store the generated workout for video recording
        setGeneratedWorkout(result);
        
        // Complete the chat session
        await chatSessionService.completeSession(true);
        
        // Navigate to the workout results screen with the workout data
        navigation.navigate('WorkoutResults', {
          workoutId: workoutDoc.id,
          workoutData: result
        });
      } else {
        throw new Error('Invalid workout structure received');
      }

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
        goals: collectedInfo.primaryGoals || collectedInfo,
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
    console.log(`Rendering message ${index}:`, message.role, message.content?.substring(0, 50) + '...');
    
    return (
      <Animated.View
        key={`message-${index}-${message.timestamp || Date.now()}`}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
          { opacity: 1 } // Remove fade animation that might be causing issues
        ]}
      >
        {!isUser && (
          <Animated.View style={{ transform: [{ scale: isStreaming && index === messages.length - 1 ? pulseAnim : 1 }] }}>
            <SafeLinearGradient
              colors={['#FFB86B', '#FF7E87']}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="fitness" size={20} color="#FFF" />
            </SafeLinearGradient>
          </Animated.View>
        )}
        
        <View style={[
          styles.messageBubble, 
          isUser ? styles.userBubble : [
            styles.assistantBubble,
            { 
              backgroundColor: theme.isDarkMode ? '#1C1C1E' : '#F0F0F0',
              borderColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }
          ]
        ]}>
          {isUser ? (
            <Text style={[styles.messageText, styles.userMessageText]}>
              {message.content}
            </Text>
          ) : (
            <MarkdownRenderer 
              content={message.content}
              style={{
                text: [styles.messageText, { color: theme.isDarkMode ? '#FFF' : '#000' }],
                h1: styles.markdownH1,
                h2: styles.markdownH2,
                h3: styles.markdownH3,
                bold: styles.markdownBold,
                listText: styles.messageText
              }}
            />
          )}
          
          {/* Add action buttons for assistant messages */}
          {!isUser && message.content && (message.content.toLowerCase().includes('exercise') || 
            message.content.toLowerCase().includes('workout') || 
            message.content.toLowerCase().includes('help')) && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Search')}
              >
                <Ionicons name="search" size={14} color="#FF6B35" />
                <Text style={styles.actionButtonText}>Browse</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Workouts')}
              >
                <Ionicons name="barbell" size={14} color="#4CAF50" />
                <Text style={styles.actionButtonText}>Workouts</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Profile')}
              >
                <Ionicons name="person" size={14} color="#2196F3" />
                <Text style={styles.actionButtonText}>Profile</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Render knowledge sources if available */}
          {!isUser && message.knowledgeSources && message.knowledgeSources.length > 0 && (
            <View style={styles.sourcesContainer}>
              <Text style={styles.sourcesHeader}>Sources:</Text>
              {message.knowledgeSources.slice(0, 3).map((source, sourceIndex) => (
                <TouchableOpacity 
                  key={sourceIndex} 
                  style={styles.sourceItem}
                  onPress={() => {
                    // Handle source link tap - could open in browser or show details
                    Alert.alert(
                      source.title,
                      `Type: ${source.type}\nRelevance: ${source.relevance}`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Link', onPress: () => {
                          // You could use Linking.openURL(source.url) here
                          console.log('Opening source:', source.url);
                        }}
                      ]
                    );
                  }}
                >
                  <Text style={styles.sourceTitle} numberOfLines={1}>
                    📄 {source.title}
                  </Text>
                  <Text style={styles.sourceDetails}>
                    {source.type} • {source.relevance}
                  </Text>
                </TouchableOpacity>
              ))}
              
              {/* Show RAG metadata if available */}
              {message.ragMetadata && (
                <Text style={styles.ragMetadata}>
                  Knowledge base: {message.ragMetadata.chunksUsed} sources used
                </Text>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderStreamingMessage = () => {
    if (!isStreaming || !streamingMessage || !streamingMessage.trim()) return null;
    
    return (
      <Animated.View style={[styles.messageContainer, styles.assistantMessageContainer]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <SafeLinearGradient
            colors={['#FFB86B', '#FF7E87']}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="fitness" size={20} color="#FFF" />
          </SafeLinearGradient>
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
        <SafeLinearGradient
          colors={['#FFB86B', '#FF7E87']}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="fitness" size={20} color="#FFF" />
        </SafeLinearGradient>
        
        <View style={styles.typingBubble}>
          <Animated.View style={[styles.typingDot, { opacity: typingDot1 }]} />
          <Animated.View style={[styles.typingDot, { opacity: typingDot2 }]} />
          <Animated.View style={[styles.typingDot, { opacity: typingDot3 }]} />
        </View>
      </View>
    );
  };

  const getProgressLabel = () => {
    if (progress === 0) return 'Getting started';
    if (progress >= 100) return 'Ready to generate workout';
    if (progress >= 85) return 'Understanding preferences';
    if (progress >= 75) return 'Learning about equipment';
    if (progress >= 60) return 'Discussing schedule';
    if (progress >= 40) return 'Exploring goals';
    if (progress >= 20) return 'Assessing experience';
    return 'Gathering information';
  };

  const renderContextBar = () => {
    const hasInfo = Object.keys(collectedInfo).some(key => 
      collectedInfo[key] && typeof collectedInfo[key] !== 'boolean'
    );
    
    if (!userContext && !hasInfo) return null;
    
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
        
        {/* Show progress stages as chips */}
        {collectedInfo.basicInfo && (
          <View style={styles.contextChip}>
            <Ionicons name="person" size={12} color="#FFB86B" />
            <Text style={styles.contextChipText}>Experience Level</Text>
          </View>
        )}
        
        {collectedInfo.goals && (
          <View style={styles.contextChip}>
            <Ionicons name="flag" size={12} color="#FFB86B" />
            <Text style={styles.contextChipText}>Goals Set</Text>
          </View>
        )}
        
        {collectedInfo.schedule && (
          <View style={styles.contextChip}>
            <Ionicons name="time" size={12} color="#FFB86B" />
            <Text style={styles.contextChipText}>Schedule Ready</Text>
          </View>
        )}
        
        {collectedInfo.equipment && (
          <View style={styles.contextChip}>
            <Ionicons name="barbell" size={12} color="#FFB86B" />
            <Text style={styles.contextChipText}>Equipment Known</Text>
          </View>
        )}
        
        {collectedInfo.limitations && (
          <View style={styles.contextChip}>
            <Ionicons name="shield-checkmark" size={12} color="#FFB86B" />
            <Text style={styles.contextChipText}>Preferences Set</Text>
          </View>
        )}
        
        {/* Show detailed info for non-boolean collected data */}
        {Object.entries(collectedInfo)
          .filter(([key, value]) => value && typeof value === 'string' && value.length > 0)
          .map(([key, value]) => {
            // Skip the summary boolean flags
            if (['basicInfo', 'goals', 'schedule', 'equipment', 'limitations', 'readyToGenerate'].includes(key)) {
              return null;
            }
            
            return (
              <View key={key} style={styles.contextChip}>
                <Text style={styles.contextChipLabel}>{key}</Text>
                <Text style={styles.contextChipValue} numberOfLines={1}>{value}</Text>
              </View>
            );
          })
          .filter(Boolean)}
      </ScrollView>
    );
  };

  // Early return for loading state to ensure proper initialization
  // This prevents the "blank screen" issue by showing a proper loading UI

  // Show loading screen during initialization
  if (isInitializing && messages.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.isDarkMode ? '#000' : '#FFF' }}>
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingAvatar, { transform: [{ scale: pulseAnim }] }]}>
            <SafeLinearGradient
              colors={['#FFB86B', '#FF7E87']}
              style={styles.loadingAvatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="fitness" size={40} color="#FFF" />
            </SafeLinearGradient>
          </Animated.View>
          <Text style={[styles.loadingText, { color: theme.isDarkMode ? '#FFF' : '#000' }]}>
            Preparing your AI coach...
          </Text>
          <ActivityIndicator 
            size="small" 
            color="#FFB86B" 
            style={{ marginTop: 20 }}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.isDarkMode ? '#000' : '#FFF' }} edges={['top']}>
      <View style={{ flex: 1, paddingBottom: Platform.OS === 'ios' ? 65 : 55 }}>
        {/* Context Status Bar - Exercises and Workouts only */}
        <View style={[styles.contextStatusBar, { 
          backgroundColor: theme.isDarkMode ? '#1C1C1E' : '#F5F5F5',
          borderBottomColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contextStatusScroll}>
            {/* Exercises Status */}
            <TouchableOpacity 
              style={[styles.contextStatusItem, { 
                backgroundColor: collectedInfo.exercises ? '#4CAF5020' : '#66666620' 
              }]}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons 
                name="barbell" 
                size={14} 
                color={collectedInfo.exercises ? '#4CAF50' : '#666'} 
              />
              <Text style={[styles.contextStatusText, {
                color: collectedInfo.exercises ? '#4CAF50' : '#666'
              }]}>
                {collectedInfo.exerciseCount || 0} Exercises
              </Text>
            </TouchableOpacity>
            
            {/* Workouts Status */}
            <TouchableOpacity 
              style={[styles.contextStatusItem, { 
                backgroundColor: userContext?.workoutHistory ? '#4CAF5020' : '#66666620' 
              }]}
              onPress={() => navigation.navigate('Workouts')}
            >
              <Ionicons 
                name="calendar" 
                size={14} 
                color={userContext?.workoutHistory ? '#4CAF50' : '#666'} 
              />
              <Text style={[styles.contextStatusText, {
                color: userContext?.workoutHistory ? '#4CAF50' : '#666'
              }]}>
                {userContext?.workoutHistory?.length || 0} Workouts
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      
      {/* Orange Logo Background - Extra large for visibility */}
      <Image
        source={require('../assets/sdlogoorange.png')}
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          opacity: theme.isDarkMode ? 0.06 : 0.04,
          top: '45%',
          left: '50%',
          marginLeft: -200,
          marginTop: -200,
          resizeMode: 'contain',
          zIndex: 0,
        }}
      />
      
      {/* Main Container with proper safe area handling and tab bar offset */}
      <KeyboardAvoidingView 
        style={[styles.container, { marginBottom: 0 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header with safe area padding */}
        <View style={styles.header}>
        <View style={styles.headerTop}>
          <Animated.Text style={[
            styles.headerTitle,
            {
              color: neonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: theme.isDarkMode ? ['#FFFFFF', '#00FF88'] : ['#000000', '#00FF88'],
              }),
              textShadowColor: neonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#00FF88'],
              }),
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: neonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 30],
              }),
            },
          ]}>
            GENERATOR
          </Animated.Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={async () => {
                Alert.alert(
                  'New Chat',
                  'Start a new chat session? Current conversation will be saved.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'New Chat', 
                      onPress: async () => {
                        await chatSessionService.completeSession(false);
                        await chatSessionService.createNewSession();
                        setProgress(0);
                        setCollectedInfo({});
                        initializeChat();
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={async () => {
                await chatSessionService.completeSession(progress >= 60);
                Alert.alert(
                  'Chat Completed',
                  'Your chat session has been saved.',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color={theme.success} />
            </TouchableOpacity>
            
            
            <TouchableOpacity 
              style={[styles.generateButton, progress >= 60 && styles.generateButtonActive]}
              onPress={generateWorkout}
              disabled={isGenerating || progress < 60}
            >
              <SafeLinearGradient
                colors={progress >= 60 ? ['#4CAF50', '#45B049'] : ['#666666', '#888888']}
                style={styles.generateButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.generateButtonText}>
                  {isGenerating ? 'Creating...' : 'Generate'}
                </Text>
              </SafeLinearGradient>
            </TouchableOpacity>
          </View>
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
              <SafeLinearGradient
                colors={['#FFB86B', '#FF7E87']}
                style={styles.progressGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
          <Text style={[styles.progressText, { color: theme.textOnGlass }]}>
            {progress}% Complete - {getProgressLabel()}
          </Text>
        </View>
        
          {/* Context Bar */}
          {renderContextBar()}
        </View>

      {/* Messages Container - Fixed styling */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => {
          // Don't auto-scroll on initial load
          if (messages.length > 1) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        }}
        showsVerticalScrollIndicator={false}
      >
          {messages.length === 0 ? (
            <View style={styles.emptyMessagesContainer}>
              <Animated.View style={[styles.loadingAvatar, { transform: [{ scale: pulseAnim }] }]}>
                <SafeLinearGradient
                  colors={['#FFB86B', '#FF7E87']}
                  style={styles.loadingAvatar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="fitness" size={24} color="#FFF" />
                </SafeLinearGradient>
              </Animated.View>
              <Text style={[styles.emptyMessagesText, { color: theme.isDarkMode ? '#AAA' : '#666' }]}>
                Welcome! I'm your AI fitness coach.
              </Text>
              <Text style={[styles.emptyMessagesSubText, { color: theme.isDarkMode ? '#666' : '#999' }]}>
                Let's create a personalized workout plan for you.
              </Text>
            </View>
          ) : (
            <>
              {messages.map((msg, index) => renderMessage(msg, index))}
              {renderStreamingMessage()}
              {renderTypingIndicator()}
            </>
          )}
          
          {isGenerating && (
            <View style={styles.generatingContainer}>
              <ActivityIndicator size="large" color="#FFB86B" />
              <Text style={styles.generatingText}>Creating your personalized workout plan...</Text>
            </View>
          )}
        </ScrollView>
        

      {/* Input */}
      <View style={[styles.inputContainer, { 
        backgroundColor: theme.isDarkMode ? '#0A0A0C' : '#F5F5F5',
        borderTopColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
      }]}>
        <TextInput
          style={[styles.input, {
            backgroundColor: theme.isDarkMode ? '#1C1C1E' : '#FFFFFF',
            color: theme.isDarkMode ? '#FFF' : '#000'
          }]}
          value={input}
          onChangeText={setInput}
          placeholder="Type your answer or ask questions..."
          placeholderTextColor={theme.isDarkMode ? '#666' : '#999'}
          multiline
          maxHeight={100}
          editable={!isStreaming && !isGenerating}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || isStreaming || isGenerating) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || isStreaming || isGenerating}
        >
          <SafeLinearGradient
            colors={input.trim() && !isStreaming && !isGenerating ? ['#FFB86B', '#FF7E87'] : ['#333', '#444']}
            style={styles.sendButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </SafeLinearGradient>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
      
      {/* Context Modal */}
      <ContextModal
        visible={showContextModal}
        onClose={() => setShowContextModal(false)}
        onNavigate={(screen) => {
          setShowContextModal(false);
          navigation.navigate(screen);
        }}
        title="Your Fitness Context"
        subtitle="Here's what I know about your fitness journey"
      />
      
      {/* Video Recorder Modal */}
      <WorkoutVideoRecorderAI
        visible={showVideoRecorder}
        workout={generatedWorkout}
        onClose={() => setShowVideoRecorder(false)}
        onSave={(videoBlob) => {
          console.log('Video saved:', videoBlob);
          Alert.alert('Success', 'Your workout video has been saved!');
        }}
        onShare={(videoBlob, workout) => {
          console.log('Sharing video:', videoBlob, workout);
          // Add sharing functionality here
        }}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contextStatusBar: {
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  contextStatusScroll: {
    flexGrow: 0,
  },
  contextStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  contextStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressItem: {
    minWidth: 80,
  },
  progressBarMini: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    flex: 1,
    marginRight: 8,
  },
  progressFillMini: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
    fontSize: 16,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    padding: 4,
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
  messagesWrapper: {
    flex: 1,
    zIndex: 1, // Ensure messages are above background
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
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
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyMessagesSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  contextButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 2,
  },
  contextButtonText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  videoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 25 : 16,
    borderTopWidth: 1,
    alignItems: 'center',
    minHeight: 70,
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 8,
    fontSize: 16,
    minHeight: 40,
    maxHeight: 120,
    textAlignVertical: 'center',
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
  // Source citation styles
  sourcesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sourcesHeader: {
    color: '#FFB86B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceItem: {
    backgroundColor: 'rgba(255, 184, 107, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 107, 0.2)',
  },
  sourceTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  sourceDetails: {
    color: '#FFB86B',
    fontSize: 11,
    opacity: 0.8,
  },
  ragMetadata: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
  },
  // Markdown styles
  markdownH1: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFB86B',
    marginTop: 16,
    marginBottom: 12,
  },
  markdownH2: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B35',
    marginTop: 14,
    marginBottom: 10,
  },
  markdownH3: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFB86B',
    marginTop: 12,
    marginBottom: 8,
  },
  markdownBold: {
    fontWeight: 'bold',
    color: '#FFB86B',
  },
});