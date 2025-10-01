import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { functions, db, auth } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export default function GeneratorScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your AI fitness coach. Tell me about your fitness goals and I\'ll create a personalized workout plan for you.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Call Firebase function
      const chatWithGemini = httpsCallable(functions, 'chatWithGemini');
      console.log('Calling Firebase function with:', userMessage);
      
      const result = await chatWithGemini({
        message: userMessage,
        history: messages
      });

      console.log('Firebase response:', result.data);
      const aiResponse = result.data.response || result.data.message || 'Received response';
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

      // Check if response contains a workout plan
      if (aiResponse.includes('Day 1') || aiResponse.includes('Week 1')) {
        setTimeout(() => {
          Alert.alert(
            'Workout Generated!',
            'Would you like to save this workout plan?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Save', 
                onPress: async () => {
                  try {
                    await addDoc(collection(db, 'workouts'), {
                      userId: auth.currentUser?.uid,
                      plan: aiResponse,
                      createdAt: new Date(),
                      messages: messages,
                    });
                    Alert.alert('Success', 'Workout saved!');
                  } catch (error) {
                    console.error('Save error:', error);
                  }
                }
              }
            ]
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Chat error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        fullError: error
      });
      
      // Show error to user
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I encountered an error: ${error.message}. Please check the console for details.`
      }]);
      
      Alert.alert(
        'Connection Error',
        'Unable to connect to AI service. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }

    setLoading(false);
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
        <Text style={styles.headerTitle}>AI Workout Generator</Text>
      </LinearGradient>

      <ScrollView style={styles.messagesContainer}>
        {messages.map((message, index) => (
          <View 
            key={index} 
            style={[
              styles.message,
              message.role === 'user' ? styles.userMessage : styles.aiMessage
            ]}
          >
            <Text style={styles.messageText}>{message.content}</Text>
          </View>
        ))}
        {loading && (
          <View style={styles.aiMessage}>
            <ActivityIndicator color="#FF6B35" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Describe your fitness goals..."
          placeholderTextColor="#666"
          multiline
          maxHeight={100}
        />
        <TouchableOpacity 
          onPress={sendMessage}
          disabled={loading || !input.trim()}
          style={styles.sendButton}
        >
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.sendButtonGradient}
          >
            <Ionicons name="send" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  messagesContainer: {
    flex: 1,
    padding: 20,
  },
  message: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    maxWidth: '80%',
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