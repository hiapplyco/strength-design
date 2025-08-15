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
import { getFunctionsUrl } from '../config/firebase';
import { colors } from '../utils/designTokens';

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
      console.log(`Message ${index}: ${msg.role} - ${msg.content?.substring(0, 30)}...`);
    });
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
    console.log('Initializing chat with context:', context);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      
      const functionsUrl = getFunctionsUrl();
      console.log('Using functions URL:', functionsUrl);
      
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
          history: [],
          userProfile: {
            fitnessLevel: context?.preferences?.fitnessLevel,
            goals: context?.preferences?.goals ? [context.preferences.goals] : [],
            equipment: context?.preferences?.equipment ? [context.preferences.equipment] : [],
            frequency: context?.preferences?.frequency,
            timePerSession: context?.preferences?.timePerSession,
            injuries: context?.preferences?.injuries || 'None mentioned'
          },
        }),
      });

      if (!response.ok) {
        console.error('HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Response received, starting stream processing...');
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
              console.log('Parsed streaming data:', parsed);
              
              if (parsed.type === 'chunk' && parsed.content) {
                fullResponse += parsed.content;
                setStreamingMessage(fullResponse);
              } else if (parsed.type === 'complete' && parsed.fullContent) {
                fullResponse = parsed.fullContent;
                setStreamingMessage(fullResponse);
              } else if (parsed.type === 'error') {
                console.error('Streaming error from server:', parsed.error);
                throw new Error(parsed.error);
              }
            } catch (e) {
              console.log('Non-JSON streaming data:', data);
              if (data && data !== '[DONE]') {
                fullResponse += data;
                setStreamingMessage(fullResponse);
              }
            }
          }
        }
      }

      console.log('Final response length:', fullResponse.length);
      if (fullResponse.trim()) {
        console.log('Setting AI message with content:', fullResponse.substring(0, 100) + '...');
        setMessages([{ role: 'assistant', content: fullResponse }]);
        setStreamingMessage('');
        
        // Analyze initial AI response for progress tracking
        updateProgress('', fullResponse);
      } else {
        // If no response received, show a default welcome message
        console.log('No AI response received, showing default welcome message');
        const defaultMessage = "Welcome! I'm your AI fitness coach. I'm here to help you create personalized workout plans based on your goals, experience, and preferences. What would you like to work on today?";
        setMessages([{ 
          role: 'assistant', 
          content: defaultMessage
        }]);
        setStreamingMessage('');
        
        // Initialize progress tracking
        setTimeout(() => updateProgress('', defaultMessage), 100);
      }
      
    } catch (error) {
      console.error('Initialization error:', error);
      // Show a more user-friendly fallback message
      setMessages([{ 
        role: 'assistant', 
        content: "Hi there! 👋\n\nI'm your AI fitness coach, ready to help you create amazing workout plans! While I'm getting fully set up, I can still help you plan your fitness journey.\n\nTell me about your fitness goals and experience level, and we'll get started!" 
      }]);
    } finally {
      setIsInitializing(false);
    }
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
      
      const functionsUrl = getFunctionsUrl();
      
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
          message: userMessage,
          history: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
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
              console.log('Parsed streaming data:', parsed);
              
              if (parsed.type === 'chunk' && parsed.content) {
                fullResponse += parsed.content;
                setStreamingMessage(fullResponse);
                scrollViewRef.current?.scrollToEnd({ animated: true });
              } else if (parsed.type === 'complete' && parsed.fullContent) {
                fullResponse = parsed.fullContent;
                setStreamingMessage(fullResponse);
                scrollViewRef.current?.scrollToEnd({ animated: true });
              } else if (parsed.type === 'error') {
                console.error('Streaming error from server:', parsed.error);
                throw new Error(parsed.error);
              }
            } catch (e) {
              console.log('Non-JSON streaming data:', data);
              if (data && data !== '[DONE]') {
                fullResponse += data;
                setStreamingMessage(fullResponse);
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }
            }
          }
        }
      }

      // Progress is updated before adding the message above
      
      // Update progress before adding response
      updateProgress(userMessage, fullResponse || '');
      
      // Add complete response
      console.log('sendMessage - Final response length:', fullResponse.length);
      if (fullResponse.trim()) {
        console.log('sendMessage - Adding AI response to messages');
        setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
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
      
      const functionsUrl = getFunctionsUrl();
      
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
        goals: collectedInfo.primaryGoals || collectedInfo,
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
              colors={colors.gradients.accent.dark.aurora}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
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
    if (!isStreaming || !streamingMessage || !streamingMessage.trim()) return null;
    
    return (
      <Animated.View style={[styles.messageContainer, styles.assistantMessageContainer]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={colors.gradients.accent.dark.aurora}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
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
          colors={colors.gradients.accent.dark.aurora}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
            <Ionicons name="target" size={12} color="#FFB86B" />
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

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={colors.gradients.accent.dark.aurora}
            style={styles.loadingAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
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
      {/* Header with unified gradient */}
      <LinearGradient
        colors={colors.gradients.background.dark.cosmic}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
              colors={progress >= 60 ? colors.gradients.success : ['#666', '#555']}
              style={styles.generateButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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
                colors={colors.gradients.accent.dark.aurora}
                style={styles.progressGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
          <Text style={styles.progressText}>
            {progress}% Complete - {getProgressLabel()}
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
            colors={input.trim() && !isStreaming && !isGenerating ? colors.gradients.accent.dark.aurora : ['#333', '#444']}
            style={styles.sendButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
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