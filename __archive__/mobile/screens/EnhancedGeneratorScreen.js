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
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { functions, db, auth } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { MarkdownParser } from '../utils/markdownParser';
import WorkoutScheduler from '../components/WorkoutScheduler';
import ShareWorkoutModal from '../components/ShareWorkoutModal';
import WorkoutActionBar from '../components/WorkoutActionBar';
import WorkoutVideoRecorder from '../components/WorkoutVideoRecorder';
import WorkoutVideoRecorderWeb from '../components/WorkoutVideoRecorderWeb';
import WorkoutVideoRecorderAI from '../components/WorkoutVideoRecorderAI';

const { width: screenWidth } = Dimensions.get('window');

export default function EnhancedGeneratorScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: '👋 **Welcome! I\'m your AI fitness coach.**\n\nI\'m here to create a personalized workout program just for you. Let\'s start with a few questions:\n\n1. What\'s your current fitness level?\n2. What are your main fitness goals?\n3. How many days per week can you train?\n4. What equipment do you have access to?\n\nFeel free to share any injuries or limitations I should know about!' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [userProfile, setUserProfile] = useState({
    fitnessLevel: null,
    goals: [],
    frequency: null,
    equipment: [],
    injuries: null,
    timePerSession: null,
  });
  const [viewMode, setViewMode] = useState('chat'); // 'chat', 'flow', 'generating', 'preview'
  const [generatedWorkout, setGeneratedWorkout] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [workoutSaved, setWorkoutSaved] = useState(false);
  const [workoutScheduled, setWorkoutScheduled] = useState(false);
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start pulsing animation for streaming indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: false, // Set to false for web compatibility
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false, // Set to false for web compatibility
        }),
      ])
    ).start();
  }, []);

  const extractProfileFromMessage = (message) => {
    const lowerMessage = message.toLowerCase();
    const profile = { ...userProfile };
    
    // Fitness level detection
    if (lowerMessage.includes('beginner') || lowerMessage.includes('new to')) {
      profile.fitnessLevel = 'beginner';
    } else if (lowerMessage.includes('intermediate') || lowerMessage.includes('some experience')) {
      profile.fitnessLevel = 'intermediate';
    } else if (lowerMessage.includes('advanced') || lowerMessage.includes('experienced')) {
      profile.fitnessLevel = 'advanced';
    }
    
    // Goals detection
    const goalKeywords = {
      'lose weight': 'weight loss',
      'weight loss': 'weight loss',
      'fat loss': 'fat loss',
      'build muscle': 'muscle gain',
      'gain muscle': 'muscle gain',
      'strength': 'strength',
      'endurance': 'endurance',
      'flexibility': 'flexibility',
      'yoga': 'flexibility',
      'tone': 'toning',
      'general fitness': 'general fitness',
    };
    
    Object.entries(goalKeywords).forEach(([keyword, goal]) => {
      if (lowerMessage.includes(keyword) && !profile.goals.includes(goal)) {
        profile.goals.push(goal);
      }
    });
    
    // Frequency detection
    const freqMatch = lowerMessage.match(/(\d+)\s*(?:days?|times?)\s*(?:per|a)\s*week/);
    if (freqMatch) {
      profile.frequency = parseInt(freqMatch[1]);
    }
    
    // Equipment detection
    const equipmentKeywords = [
      'dumbbells', 'barbell', 'kettlebell', 'bands', 'resistance bands',
      'pull-up bar', 'bench', 'gym', 'home gym', 'bodyweight', 'no equipment'
    ];
    
    equipmentKeywords.forEach(equipment => {
      if (lowerMessage.includes(equipment) && !profile.equipment.includes(equipment)) {
        profile.equipment.push(equipment);
      }
    });
    
    // Injuries detection
    if (lowerMessage.includes('injury') || lowerMessage.includes('pain') || 
        lowerMessage.includes('bad') || lowerMessage.includes('hurt')) {
      const injuryMatch = lowerMessage.match(/(knee|back|shoulder|ankle|wrist|elbow|neck)[^.]*(?:injury|pain|issue|problem)/);
      if (injuryMatch) {
        profile.injuries = injuryMatch[0];
      }
    }
    
    // Time per session
    const timeMatch = lowerMessage.match(/(\d+)\s*(?:minutes?|mins?|hours?)/);
    if (timeMatch) {
      profile.timePerSession = parseInt(timeMatch[1]);
    }
    
    setUserProfile(profile);
    return profile;
  };

  const streamChat = async (userMessage) => {
    setIsStreaming(true);
    setStreamingMessage('');
    
    try {
      // Get auth token if available
      let headers = {
        'Content-Type': 'application/json',
      };
      
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      }
      
      const response = await fetch('https://us-central1-strength-design.cloudfunctions.net/streamingChatEnhanced', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          userProfile: userProfile,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.type === 'chunk') {
                fullMessage += data.content;
                setStreamingMessage(fullMessage);
                
                // Auto-scroll to bottom
                scrollViewRef.current?.scrollToEnd({ animated: true });
              } else if (data.type === 'complete') {
                setMessages(prev => [...prev, { 
                  role: 'assistant', 
                  content: data.fullContent 
                }]);
                setStreamingMessage('');
                
                // Check if workout was generated
                if (data.fullContent.includes('## Program Overview') || 
                    data.fullContent.includes('## Week')) {
                  const workoutData = MarkdownParser.extractWorkoutData(data.fullContent);
                  // Add the raw content for saving
                  workoutData.rawContent = data.fullContent;
                  setGeneratedWorkout(workoutData);
                  
                  // Vibrate to indicate success
                  Vibration.vibrate(100);
                }
              } else if (data.type === 'workout_generated') {
                // Workout was generated
                Vibration.vibrate(100);
              } else if (data.type === 'error') {
                console.error('Stream error:', data.error);
                Alert.alert('Error', 'Failed to get response. Please try again.');
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      Alert.alert('Connection Error', 'Unable to connect to AI service.');
    } finally {
      setIsStreaming(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Extract profile information from message
    const updatedProfile = extractProfileFromMessage(userMessage);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }

    // Stream the response
    await streamChat(userMessage);
  };

  const saveWorkout = async (workoutData, rawContent) => {
    try {
      const workoutDoc = {
        userId: auth.currentUser?.uid,
        title: workoutData.title || 'Custom Workout Program',
        rawContent: rawContent,
        structuredData: workoutData,
        userProfile: userProfile,
        createdAt: new Date(),
        isActive: true,
        completedDays: [],
        totalDays: workoutData.weeks.reduce((sum, week) => sum + week.days.length, 0),
      };

      const docRef = await addDoc(collection(db, 'workouts'), workoutDoc);
      
      setWorkoutSaved(true);
      
      Alert.alert(
        '✅ Workout Saved!',
        'Your workout plan has been saved to your library.',
        [
          { text: 'View Workouts', onPress: () => navigation.navigate('Workouts') },
          { text: 'OK', style: 'cancel' }
        ]
      );
      
      return docRef.id;
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
  };

  const QuickResponseButton = ({ text, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.quickButton}>
      <Text style={styles.quickButtonText}>{text}</Text>
    </TouchableOpacity>
  );

  const getContextualSuggestions = () => {
    // Get the last AI message
    const lastAIMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAIMessage) return [];

    const lastContent = lastAIMessage.content.toLowerCase();
    const suggestions = [];

    // Check if workout was generated
    if (generatedWorkout || lastContent.includes('week 1') || lastContent.includes('day 1')) {
      suggestions.push(
        { text: "Can you make it easier?", prompt: "Can you modify this workout to be easier?" },
        { text: "Add more cardio", prompt: "Can you add more cardio exercises to this workout?" },
        { text: "I don't have that equipment", prompt: "I don't have some of that equipment. Can you suggest alternatives?" }
      );
      return suggestions;
    }

    // Check what the AI is asking about
    if (lastContent.includes('fitness level') || lastContent.includes('how experienced')) {
      suggestions.push(
        { text: "I'm a beginner", prompt: "I'm a beginner" },
        { text: "Intermediate level", prompt: "I have intermediate fitness level" },
        { text: "Advanced", prompt: "I'm advanced" }
      );
    } else if (lastContent.includes('goal') || lastContent.includes('what are you looking')) {
      suggestions.push(
        { text: "Build muscle 💪", prompt: "I want to build muscle" },
        { text: "Lose weight 🏃", prompt: "I want to lose weight" },
        { text: "Get stronger 🏋️", prompt: "I want to get stronger" },
        { text: "Improve flexibility 🧘", prompt: "I want to improve flexibility" }
      );
    } else if (lastContent.includes('how many days') || lastContent.includes('frequency')) {
      suggestions.push(
        { text: "3 days/week", prompt: "I can train 3 days per week" },
        { text: "4 days/week", prompt: "I can train 4 days per week" },
        { text: "5+ days/week", prompt: "I can train 5 or more days per week" }
      );
    } else if (lastContent.includes('equipment') || lastContent.includes('what do you have')) {
      suggestions.push(
        { text: "Just bodyweight", prompt: "I only have my bodyweight, no equipment" },
        { text: "Dumbbells", prompt: "I have dumbbells" },
        { text: "Full gym", prompt: "I have access to a full gym" },
        { text: "Home gym basics", prompt: "I have dumbbells, resistance bands, and a pull-up bar" }
      );
    } else if (lastContent.includes('injur') || lastContent.includes('limitation')) {
      suggestions.push(
        { text: "No injuries", prompt: "I don't have any injuries or limitations" },
        { text: "Bad knees", prompt: "I have bad knees" },
        { text: "Back issues", prompt: "I have some back issues" }
      );
    } else if (lastContent.includes('time') || lastContent.includes('how long')) {
      suggestions.push(
        { text: "30 minutes", prompt: "I have about 30 minutes per session" },
        { text: "45 minutes", prompt: "I have about 45 minutes per session" },
        { text: "1 hour", prompt: "I have about an hour per session" }
      );
    }

    // If profile is complete but no workout yet, offer to generate
    const profileComplete = userProfile.fitnessLevel && 
                          userProfile.goals.length > 0 && 
                          userProfile.frequency;
    
    if (profileComplete && !generatedWorkout && suggestions.length === 0) {
      suggestions.push({
        text: "Generate my workout plan 💪",
        prompt: `Create a complete workout program for me based on my profile: 
              Fitness level: ${userProfile.fitnessLevel}, 
              Goals: ${userProfile.goals.join(', ')}, 
              Training ${userProfile.frequency} days/week, 
              Equipment: ${userProfile.equipment.join(', ') || 'bodyweight'}`
      });
    }

    return suggestions;
  };

  const renderQuickResponses = () => {
    const suggestions = getContextualSuggestions();
    
    // If a workout is being generated or exists, show complete button
    if (generatedWorkout || (messages.length > 0 && 
        messages[messages.length - 1].content?.toLowerCase().includes('week') ||
        messages[messages.length - 1].content?.toLowerCase().includes('day'))) {
      return (
        <View style={styles.quickResponses}>
          <TouchableOpacity 
            style={[styles.completeButton]}
            onPress={() => {
              // Check if we have enough workout data to save
              const lastMessage = messages[messages.length - 1];
              if (lastMessage && lastMessage.role === 'assistant') {
                const workoutData = MarkdownParser.extractWorkoutData(lastMessage.content);
                if (workoutData && (workoutData.weeks?.length > 0 || lastMessage.content.includes('Day'))) {
                  workoutData.rawContent = lastMessage.content;
                  setGeneratedWorkout(workoutData);
                  Vibration.vibrate(100);
                  
                  // Show success message
                  Alert.alert(
                    '✅ Workout Complete!',
                    'Your workout has been generated. You can now save, schedule, or share it.',
                    [{ text: 'OK' }]
                  );
                }
              }
            }}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.completeButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.completeButtonText}>Complete Generation</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {suggestions.map((suggestion, index) => (
            <QuickResponseButton 
              key={index}
              text={suggestion.text}
              onPress={async () => {
                const userMessage = suggestion.prompt;
                setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
                
                // Extract profile information from message
                const updatedProfile = extractProfileFromMessage(userMessage);
                
                // Haptic feedback
                if (Platform.OS === 'ios') {
                  Vibration.vibrate(10);
                }

                // Stream the response
                await streamChat(userMessage);
              }}
            />
          ))}
        </View>
      );
    }
    
    if (suggestions.length === 0) return null;

    return (
      <View style={styles.quickResponses}>
        {suggestions.map((suggestion, index) => (
          <QuickResponseButton 
            key={index}
            text={suggestion.text}
            onPress={async () => {
              const userMessage = suggestion.prompt;
              setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
              
              // Extract profile information from message
              const updatedProfile = extractProfileFromMessage(userMessage);
              
              // Haptic feedback
              if (Platform.OS === 'ios') {
                Vibration.vibrate(10);
              }

              // Stream the response
              await streamChat(userMessage);
            }}
          />
        ))}
      </View>
    );
  };

  const ProfileIndicator = () => {
    const completeness = [
      userProfile.fitnessLevel ? 1 : 0,
      userProfile.goals.length > 0 ? 1 : 0,
      userProfile.frequency ? 1 : 0,
      userProfile.equipment.length > 0 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    // Check if workout is being generated
    const lastMessage = messages[messages.length - 1];
    const isGenerating = lastMessage && lastMessage.role === 'assistant' && 
                        (lastMessage.content?.toLowerCase().includes('week') || 
                         lastMessage.content?.toLowerCase().includes('day'));

    // Hide when workout action bar is showing
    if (generatedWorkout) {
      return null;
    }

    // Show generation status if workout is being generated
    if (isGenerating) {
      return (
        <View style={[styles.profileIndicator, styles.generatingIndicator]}>
          <View style={styles.generatingHeader}>
            <Ionicons name="create-outline" size={20} color="#4CAF50" />
            <Text style={styles.generatingText}>Workout Generation in Progress</Text>
          </View>
          <Text style={styles.generatingSubtext}>
            Your personalized workout is being created. Tap "Complete Generation" when ready.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.profileIndicator}>
        <Text style={styles.profileText}>Profile Completeness</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(completeness / 4) * 100}%` }
            ]} 
          />
        </View>
        <View style={styles.profileDetails}>
          {userProfile.fitnessLevel && (
            <Text style={styles.profileItem}>📊 {userProfile.fitnessLevel}</Text>
          )}
          {userProfile.goals.length > 0 && (
            <Text style={styles.profileItem}>🎯 {userProfile.goals.join(', ')}</Text>
          )}
          {userProfile.frequency && (
            <Text style={styles.profileItem}>📅 {userProfile.frequency} days/week</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        style={styles.header}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Workout Coach</Text>
        <View style={styles.headerButtons}>
          {generatedWorkout && (
            <TouchableOpacity 
              onPress={() => setShowShareModal(true)}
              style={styles.headerButton}
            >
              <Ionicons name="share-outline" size={20} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'chat' ? 'flow' : 'chat')}
            style={styles.headerButton}
          >
            <Ionicons 
              name={viewMode === 'chat' ? 'list' : 'chatbubbles'} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ProfileIndicator />

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message, index) => (
          <View 
            key={index} 
            style={[
              styles.message,
              message.role === 'user' ? styles.userMessage : styles.aiMessage
            ]}
          >
            {message.role === 'assistant' ? (
              <MarkdownRenderer content={message.content} />
            ) : (
              <Text style={styles.messageText}>{message.content}</Text>
            )}
          </View>
        ))}
        
        {isStreaming && streamingMessage && (
          <View style={styles.aiMessage}>
            <MarkdownRenderer content={streamingMessage} />
            <Animated.View 
              style={[
                styles.streamingIndicator,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <View style={styles.streamingDot} />
            </Animated.View>
          </View>
        )}
        
        {loading && !isStreaming && (
          <View style={styles.aiMessage}>
            <ActivityIndicator color="#FF6B35" />
          </View>
        )}
      </ScrollView>

      {renderQuickResponses()}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Describe your fitness goals..."
          placeholderTextColor="#666"
          multiline
          maxHeight={100}
          editable={!isStreaming}
        />
        <TouchableOpacity 
          onPress={sendMessage}
          disabled={loading || !input.trim() || isStreaming}
          style={styles.sendButton}
        >
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.sendButtonGradient}
          >
            {isStreaming ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {generatedWorkout && (
        <>
          <WorkoutScheduler
            workout={generatedWorkout}
            visible={showScheduler}
            onClose={() => setShowScheduler(false)}
            onScheduled={(result) => {
              console.log('Workout scheduled:', result);
              setWorkoutScheduled(true);
              // Optionally save the workout after scheduling
              if (generatedWorkout && !workoutSaved) {
                saveWorkout(generatedWorkout, generatedWorkout.rawContent);
              }
            }}
          />
          <ShareWorkoutModal
            workout={generatedWorkout}
            visible={showShareModal}
            onClose={() => setShowShareModal(false)}
          />
          {Platform.OS === 'web' ? (
            <WorkoutVideoRecorderAI
              workout={generatedWorkout}
              visible={showVideoRecorder}
              onClose={() => setShowVideoRecorder(false)}
              onSave={(video) => {
                console.log('Video saved:', video);
              }}
              onShare={(videoUri, workout) => {
                console.log('Share video:', videoUri);
                // Implement social sharing logic here
                setShowShareModal(true);
              }}
            />
          ) : (
            <WorkoutVideoRecorder
              workout={generatedWorkout}
              visible={showVideoRecorder}
              onClose={() => setShowVideoRecorder(false)}
              onSave={(video) => {
                console.log('Video saved:', video);
              }}
              onShare={(videoUri, workout) => {
                console.log('Share video:', videoUri);
                // Implement social sharing logic here
                setShowShareModal(true);
              }}
            />
          )}
        </>
      )}
      
      {/* Workout Action Bar - Shows when workout is generated */}
      <WorkoutActionBar
        visible={!!generatedWorkout}
        workout={generatedWorkout}
        isSaved={workoutSaved}
        isScheduled={workoutScheduled}
        onSave={() => {
          if (generatedWorkout) {
            saveWorkout(generatedWorkout, generatedWorkout.rawContent);
          }
        }}
        onSchedule={() => setShowScheduler(true)}
        onShare={() => setShowShareModal(true)}
        onStartWorkout={() => {
          // Navigate to active workout screen
          navigation.navigate('ActiveWorkout', { workout: generatedWorkout });
        }}
        onRecord={() => setShowVideoRecorder(true)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 5,
    marginLeft: 10,
  },
  profileIndicator: {
    backgroundColor: '#1a1a1a',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  profileText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  profileDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  profileItem: {
    color: 'white',
    fontSize: 11,
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  generatingIndicator: {
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  generatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  generatingText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  generatingSubtext: {
    color: '#999',
    fontSize: 12,
    lineHeight: 16,
  },
  messagesContainer: {
    flex: 1,
    padding: 20,
  },
  message: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    maxWidth: '85%',
  },
  userMessage: {
    backgroundColor: '#FF6B35',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: '#1a1a1a',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  messageText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  streamingIndicator: {
    flexDirection: 'row',
    marginTop: 8,
  },
  streamingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  quickResponses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  quickButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B35',
    marginRight: 8,
    marginBottom: 8,
  },
  quickButtonText: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '500',
  },
  completeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 8,
    marginBottom: 8,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    fontSize: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});