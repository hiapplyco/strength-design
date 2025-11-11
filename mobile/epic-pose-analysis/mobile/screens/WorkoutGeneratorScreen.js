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
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

const GOAL_QUESTIONS = [
  { id: 'fitness_level', question: "What's your current fitness level?", progress: 15 },
  { id: 'primary_goal', question: "What's your primary fitness goal?", progress: 30 },
  { id: 'workout_frequency', question: "How many days per week can you workout?", progress: 45 },
  { id: 'workout_duration', question: "How long do you want each workout to be?", progress: 60 },
  { id: 'equipment', question: "What equipment do you have access to?", progress: 75 },
  { id: 'preferences', question: "Any specific preferences or limitations?", progress: 90 },
];

export default function WorkoutGeneratorScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Welcome! I'm here to create your perfect workout plan. Let's start with a few questions to understand your goals better.\n\nWhat's your current fitness level? (Beginner, Intermediate, or Advanced)"
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollViewRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    
    // Store user response
    const currentQuestion = GOAL_QUESTIONS[currentQuestionIndex];
    if (currentQuestion) {
      setUserResponses(prev => ({
        ...prev,
        [currentQuestion.id]: userMessage
      }));
      
      // Update progress
      setProgress(currentQuestion.progress);
      
      // Move to next question or complete
      if (currentQuestionIndex < GOAL_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        const nextQuestion = GOAL_QUESTIONS[currentQuestionIndex + 1];
        
        // Add assistant's next question
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Great! ${getEncouragement()}\n\n${nextQuestion.question}`
          }]);
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 500);
        
        return;
      }
    }
    
    // If we've collected all info, chat naturally
    setIsStreaming(true);
    setStreamingMessage('');
    
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
          message: userMessage,
          context: { goals: userResponses },
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

      setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const getEncouragement = () => {
    const encouragements = [
      "Perfect!",
      "Excellent choice!",
      "That's great!",
      "Wonderful!",
      "Good to know!",
      "Fantastic!"
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  };

  const completeAndGenerate = async () => {
    if (Object.keys(userResponses).length < 3) {
      Alert.alert('More Info Needed', 'Please answer at least the first 3 questions to generate a workout plan.');
      return;
    }

    setIsGenerating(true);
    setProgress(100);

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      
      const functionsUrl = 'http://localhost:5001/demo-strength-design/us-central1';
      
      // Generate workout based on collected information
      const response = await fetch(`${functionsUrl}/generateWorkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          goals: userResponses,
          userId: user?.uid,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate workout');

      const workoutData = await response.json();
      
      // Save workout to Firestore
      const workoutRef = await addDoc(collection(db, 'workouts'), {
        userId: user?.uid,
        ...workoutData.data,
        goals: userResponses,
        createdAt: serverTimestamp(),
        isActive: true,
      });

      // Create daily workout cards
      const days = workoutData.data.schedule || [];
      for (let i = 0; i < days.length; i++) {
        await addDoc(collection(db, 'dailyWorkouts'), {
          userId: user?.uid,
          workoutId: workoutRef.id,
          dayNumber: i + 1,
          dayName: days[i].day,
          exercises: days[i].exercises,
          completed: false,
          scheduledDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert(
        '🎉 Workout Generated!',
        'Your personalized workout plan has been created and saved.',
        [
          { text: 'View Workouts', onPress: () => navigation.navigate('Workouts') }
        ]
      );

    } catch (error) {
      console.error('Generation error:', error);
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
          <Text style={styles.headerTitle}>Workout Generator</Text>
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={completeAndGenerate}
            disabled={isGenerating}
          >
            <LinearGradient
              colors={['#4CAF50', '#45B049']}
              style={styles.completeButtonGradient}
            >
              <Text style={styles.completeButtonText}>
                {isGenerating ? 'Generating...' : 'Complete'}
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
          <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
        </View>
        
        {/* Goals Summary */}
        {progress > 0 && (
          <ScrollView 
            horizontal 
            style={styles.goalsContainer}
            showsHorizontalScrollIndicator={false}
          >
            {Object.entries(userResponses).map(([key, value]) => (
              <View key={key} style={styles.goalChip}>
                <Text style={styles.goalChipLabel}>
                  {key.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={styles.goalChipValue}>{value}</Text>
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
            <Text style={styles.typingText}>AI is typing...</Text>
          </View>
        )}
        
        {isGenerating && (
          <View style={styles.generatingContainer}>
            <ActivityIndicator size="large" color="#FFB86B" />
            <Text style={styles.generatingText}>Generating your personalized workout plan...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={
            currentQuestionIndex < GOAL_QUESTIONS.length 
              ? "Type your answer..." 
              : "Ask me anything about your workout..."
          }
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
  goalsContainer: {
    paddingHorizontal: 20,
    maxHeight: 60,
  },
  goalChip: {
    backgroundColor: 'rgba(255, 184, 107, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 107, 0.3)',
  },
  goalChipLabel: {
    color: '#FFB86B',
    fontSize: 10,
    opacity: 0.8,
    marginBottom: 2,
  },
  goalChipValue: {
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