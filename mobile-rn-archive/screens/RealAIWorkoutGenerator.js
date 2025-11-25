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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SYSTEM_PROMPT = `You are an expert fitness coach specializing in personalized workout programs. Your role is to:

1. Ask thoughtful, probing questions to understand the user's fitness goals, experience, and preferences
2. Build a comprehensive understanding through natural conversation
3. Track progress towards having enough information to create a workout plan
4. Generate detailed, personalized workout programs when ready

For each response:
- Ask ONE clear, focused question
- Acknowledge what they've shared
- Build on their previous answers
- Be encouraging and professional
- If they mention specific interests (like inverted yoga), dive deeper into that

Progress tracking:
- After learning about fitness level: 20% complete
- After understanding primary goals: 40% complete  
- After knowing workout frequency: 60% complete
- After workout duration preference: 75% complete
- After equipment/space available: 85% complete
- After any limitations/preferences: 95% complete
- Ready to generate: 100% complete

When you have enough information (at least 60%), you can generate a structured workout plan.

Current conversation context will be provided with each message.`;

export default function RealAIWorkoutGenerator({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [collectedInfo, setCollectedInfo] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollViewRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize with AI greeting
    initializeChat();
  }, []);

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const initializeChat = async () => {
    setIsInitializing(true);
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      
      const functionsUrl = 'http://localhost:5001/demo-strength-design/us-central1';
      
      const response = await fetch(`${functionsUrl}/streamingChatEnhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: "Start the conversation as a fitness coach. Greet the user warmly and ask your first question to understand their fitness level and experience.",
          systemPrompt: SYSTEM_PROMPT,
          context: { isInitial: true },
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
              }
            } catch (e) {
              if (data && data !== '[DONE]') {
                fullResponse += data;
              }
            }
          }
        }
      }

      setMessages([{ role: 'assistant', content: fullResponse }]);
      
    } catch (error) {
      console.warn('Initialization failed (using fallback):', error.message || error);
      setMessages([{
        role: 'assistant',
        content: "Welcome! I'm your AI fitness coach. Let's create your perfect workout plan. First, could you tell me about your current fitness level and any exercise experience you have?"
      }]);
    } finally {
      setIsInitializing(false);
    }
  };

  const analyzeProgress = (userMessage, aiResponse) => {
    // Extract progress from AI response if it mentions completion percentage
    const progressMatch = aiResponse.match(/(\d+)%\s*complete/i);
    if (progressMatch) {
      const newProgress = parseInt(progressMatch[1]);
      setProgress(newProgress);
    }
    
    // Store collected information
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('beginner') || lowerMessage.includes('intermediate') || lowerMessage.includes('advanced')) {
      setCollectedInfo(prev => ({ ...prev, fitnessLevel: userMessage }));
      if (progress < 20) setProgress(20);
    }
    if (lowerMessage.includes('yoga') || lowerMessage.includes('strength') || lowerMessage.includes('cardio')) {
      setCollectedInfo(prev => ({ ...prev, primaryGoal: userMessage }));
      if (progress < 40) setProgress(40);
    }
    if (/\d+\s*(days?|times?)\s*(per|a)\s*week/i.test(userMessage)) {
      setCollectedInfo(prev => ({ ...prev, frequency: userMessage }));
      if (progress < 60) setProgress(60);
    }
    if (/\d+\s*(minutes?|mins?|hours?|hrs?)/i.test(userMessage)) {
      setCollectedInfo(prev => ({ ...prev, duration: userMessage }));
      if (progress < 75) setProgress(75);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    
    // Start streaming
    setIsStreaming(true);
    setStreamingMessage('');
    
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      
      const functionsUrl = 'http://localhost:5001/demo-strength-design/us-central1';
      
      // Build context from conversation
      const conversationContext = `
Current collected information:
${JSON.stringify(collectedInfo, null, 2)}

Progress: ${progress}% complete

User's latest message: ${userMessage}

Conversation history:
${newMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

Please continue the conversation as a fitness coach. If you have enough information (60%+), mention that you can generate a workout plan. Always track and mention the current progress percentage.`;
      
      const response = await fetch(`${functionsUrl}/streamingChatEnhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: conversationContext,
          systemPrompt: SYSTEM_PROMPT,
          context: collectedInfo,
          history: newMessages.slice(-10),
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

      // Analyze the response for progress updates
      analyzeProgress(userMessage, fullResponse);
      
      // Add complete response to messages
      setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
      
    } catch (error) {
      console.warn('Chat error (non-critical):', error.message || error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
    }
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
      
      const workoutPrompt = `Based on our conversation, generate a detailed weekly workout plan.

User Information:
${JSON.stringify(collectedInfo, null, 2)}

Create a structured workout plan with:
1. Weekly schedule (${collectedInfo.frequency || '3-4'} days)
2. Specific exercises for each day
3. Sets, reps, and progression guidelines
4. Focus on their goals: ${collectedInfo.primaryGoal || 'general fitness'}
5. Duration per session: ${collectedInfo.duration || '45-60 minutes'}

Format the response as a detailed, actionable workout program.`;
      
      const response = await fetch(`${functionsUrl}/streamingChatEnhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: workoutPrompt,
          systemPrompt: "You are a fitness coach creating a detailed workout plan. Be specific with exercises, sets, reps, and progression.",
          context: collectedInfo,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate workout');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let workoutPlan = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                workoutPlan += parsed.text;
              }
            } catch (e) {
              if (data && data !== '[DONE]') {
                workoutPlan += data;
              }
            }
          }
        }
      }
      
      // Save workout to Firestore
      const workoutRef = await addDoc(collection(db, 'workouts'), {
        userId: user?.uid,
        plan: workoutPlan,
        goals: collectedInfo,
        createdAt: serverTimestamp(),
        isActive: true,
      });

      Alert.alert(
        '🎉 Workout Generated!',
        'Your personalized workout plan has been created based on our conversation.',
        [
          { text: 'View Workouts', onPress: () => navigation.navigate('Workouts') }
        ]
      );

    } catch (error) {
      console.warn('Workout generation failed:', error.message || error);
      Alert.alert('Error', 'Failed to generate workout. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer
        ]}
      >
        {!isUser && (
          <LinearGradient
            colors={['#FF7E87', '#FFB86B']}
            style={styles.avatar}
          >
            <Ionicons name="fitness" size={20} color="#FFF" />
          </LinearGradient>
        )}
        
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderStreamingMessage = () => {
    if (!isStreaming || !streamingMessage) return null;
    
    return (
      <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
        <LinearGradient
          colors={['#FF7E87', '#FFB86B']}
          style={styles.avatar}
        >
          <Ionicons name="fitness" size={20} color="#FFF" />
        </LinearGradient>
        
        <View style={[styles.messageBubble, styles.assistantBubble]}>
          <Text style={styles.messageText}>{streamingMessage}</Text>
        </View>
      </View>
    );
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB86B" />
        <Text style={styles.loadingText}>Connecting to your AI coach...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header with Progress */}
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
            style={[styles.completeButton, progress >= 60 && styles.completeButtonActive]}
            onPress={generateWorkout}
            disabled={isGenerating || progress < 60}
          >
            <LinearGradient
              colors={progress >= 60 ? ['#4CAF50', '#45B049'] : ['#666', '#555']}
              style={styles.completeButtonGradient}
            >
              <Text style={styles.completeButtonText}>
                {isGenerating ? 'Generating...' : progress >= 60 ? 'Generate Plan' : `${60 - progress}% more`}
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
            {progress}% Complete - {progress < 60 ? 'Gathering information' : 'Ready to generate'}
          </Text>
        </View>
        
        {/* Collected Info Summary */}
        {Object.keys(collectedInfo).length > 0 && (
          <ScrollView 
            horizontal 
            style={styles.infoContainer}
            showsHorizontalScrollIndicator={false}
          >
            {Object.entries(collectedInfo).map(([key, value]) => (
              <View key={key} style={styles.infoChip}>
                <Text style={styles.infoChipLabel}>
                  {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                </Text>
                <Text style={styles.infoChipValue} numberOfLines={1}>
                  {value}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
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
        
        {isStreaming && !streamingMessage && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#FFB86B" />
            <Text style={styles.typingText}>AI is thinking...</Text>
          </View>
        )}
        
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
  loadingText: {
    color: '#FFB86B',
    fontSize: 16,
    marginTop: 16,
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
  completeButton: {
    borderRadius: 20,
    opacity: 0.5,
  },
  completeButtonActive: {
    opacity: 1,
  },
  completeButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  completeButtonText: {
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
  infoContainer: {
    paddingHorizontal: 20,
    maxHeight: 60,
  },
  infoChip: {
    backgroundColor: 'rgba(255, 184, 107, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 107, 0.3)',
    minWidth: 100,
  },
  infoChipLabel: {
    color: '#FFB86B',
    fontSize: 10,
    opacity: 0.8,
    marginBottom: 2,
  },
  infoChipValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
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
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 44,
    paddingVertical: 8,
  },
  typingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
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