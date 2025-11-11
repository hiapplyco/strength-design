/**
 * Chat Session Service
 * Manages persistent chat sessions across navigation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

const CURRENT_SESSION_KEY = '@current_chat_session';
const SESSION_MESSAGES_KEY = '@session_messages';

class ChatSessionService {
  constructor() {
    this.currentSession = null;
    this.messages = [];
    this.listeners = new Set();
  }

  // Subscribe to session changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners of changes
  notifyListeners() {
    this.listeners.forEach(listener => listener({
      session: this.currentSession,
      messages: this.messages
    }));
  }

  // Initialize or restore current session
  async initializeSession() {
    try {
      // Try to load existing session from AsyncStorage
      const savedSession = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
      const savedMessages = await AsyncStorage.getItem(SESSION_MESSAGES_KEY);
      
      if (savedSession) {
        this.currentSession = JSON.parse(savedSession);
        this.messages = savedMessages ? JSON.parse(savedMessages) : [];
        console.log('📱 Restored chat session:', this.currentSession.id);
      } else {
        // Create new session
        await this.createNewSession();
      }
      
      this.notifyListeners();
      return this.currentSession;
    } catch (error) {
      console.error('Error initializing session:', error);
      await this.createNewSession();
      return this.currentSession;
    }
  }

  // Create a new chat session
  async createNewSession() {
    try {
      const user = auth.currentUser;
      
      const newSession = {
        id: `session_${Date.now()}`,
        userId: user?.uid || 'anonymous',
        startedAt: new Date().toISOString(),
        status: 'active',
        messageCount: 0,
        context: {},
        collectedInfo: {}
      };

      this.currentSession = newSession;
      this.messages = [];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(newSession));
      await AsyncStorage.setItem(SESSION_MESSAGES_KEY, JSON.stringify([]));
      
      // Save to Firestore if user is authenticated
      if (user) {
        try {
          const docRef = await addDoc(collection(db, 'chatSessions'), {
            ...newSession,
            userId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          newSession.firestoreId = docRef.id;
          await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(newSession));
        } catch (error) {
          console.error('Error saving session to Firestore:', error);
        }
      }
      
      console.log('🆕 Created new chat session:', newSession.id);
      this.notifyListeners();
      return newSession;
    } catch (error) {
      console.error('Error creating new session:', error);
      throw error;
    }
  }

  // Add message to current session
  async addMessage(message) {
    try {
      if (!this.currentSession) {
        await this.initializeSession();
      }

      const newMessage = {
        ...message,
        id: message.id || `msg_${Date.now()}`,
        sessionId: this.currentSession.id,
        timestamp: message.timestamp || new Date().toISOString()
      };

      this.messages.push(newMessage);
      this.currentSession.messageCount = this.messages.length;
      this.currentSession.lastMessageAt = newMessage.timestamp;
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(SESSION_MESSAGES_KEY, JSON.stringify(this.messages));
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(this.currentSession));
      
      // Update Firestore if available
      if (this.currentSession.firestoreId) {
        try {
          await updateDoc(doc(db, 'chatSessions', this.currentSession.firestoreId), {
            messageCount: this.messages.length,
            lastMessageAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.error('Error updating Firestore:', error);
        }
      }
      
      this.notifyListeners();
      return newMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Get current session messages
  getMessages() {
    return this.messages;
  }

  // Get current session
  getCurrentSession() {
    return this.currentSession;
  }

  // Update session context (for collected info)
  async updateSessionContext(context) {
    try {
      if (!this.currentSession) {
        await this.initializeSession();
      }

      this.currentSession.context = {
        ...this.currentSession.context,
        ...context
      };
      
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(this.currentSession));
      
      if (this.currentSession.firestoreId) {
        try {
          await updateDoc(doc(db, 'chatSessions', this.currentSession.firestoreId), {
            context: this.currentSession.context,
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.error('Error updating context in Firestore:', error);
        }
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error updating session context:', error);
    }
  }

  // Complete current session
  async completeSession(workoutGenerated = false) {
    try {
      if (!this.currentSession) return;

      this.currentSession.status = 'completed';
      this.currentSession.completedAt = new Date().toISOString();
      this.currentSession.workoutGenerated = workoutGenerated;
      
      // Save final state
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(this.currentSession));
      
      // Update Firestore
      if (this.currentSession.firestoreId) {
        try {
          await updateDoc(doc(db, 'chatSessions', this.currentSession.firestoreId), {
            status: 'completed',
            completedAt: serverTimestamp(),
            workoutGenerated,
            updatedAt: serverTimestamp(),
            messages: this.messages // Save all messages on completion
          });
        } catch (error) {
          console.error('Error completing session in Firestore:', error);
        }
      }
      
      // Clear current session
      await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
      await AsyncStorage.removeItem(SESSION_MESSAGES_KEY);
      
      console.log('✅ Completed chat session:', this.currentSession.id);
      
      this.currentSession = null;
      this.messages = [];
      this.notifyListeners();
    } catch (error) {
      console.error('Error completing session:', error);
    }
  }

  // Clear current session without saving
  async clearSession() {
    try {
      await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
      await AsyncStorage.removeItem(SESSION_MESSAGES_KEY);
      
      this.currentSession = null;
      this.messages = [];
      this.notifyListeners();
      
      console.log('🗑️ Cleared current session');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  // Load recent sessions for history
  async loadRecentSessions() {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      const q = query(
        collection(db, 'chatSessions'),
        where('userId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const sessions = [];
      
      snapshot.forEach(doc => {
        sessions.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return sessions;
    } catch (error) {
      console.error('Error loading recent sessions:', error);
      return [];
    }
  }
}

// Create singleton instance
const chatSessionService = new ChatSessionService();

export default chatSessionService;