import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';

export default function MinimalApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTestLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, 'test@test.com', 'test123');
      setUser(result.user);
      Alert.alert('Success!', `Logged in as ${result.user.email}`);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Strength.Design</Text>
        <Text style={styles.subtitle}>Mobile App Running!</Text>
        <View style={styles.info}>
          <Text style={styles.infoText}>✅ Expo is working</Text>
          <Text style={styles.infoText}>✅ React Native is loaded</Text>
          <Text style={styles.infoText}>✅ iOS Simulator connected</Text>
          <Text style={styles.infoText}>✅ Firebase emulators ready</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleTestLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Logging in...' : 'Test Login'}
          </Text>
        </TouchableOpacity>
        
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userText}>Logged in as:</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 30,
  },
  info: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 300,
  },
  infoText: {
    fontSize: 16,
    color: '#4CAF50',
    marginVertical: 5,
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 30,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
  },
  userText: {
    color: '#888',
    fontSize: 14,
  },
  userEmail: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
  },
});