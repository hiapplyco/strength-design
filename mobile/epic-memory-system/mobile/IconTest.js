import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Test different import methods for Ionicons
let Ionicons;
let iconError = null;

try {
  // Method 1: Direct import
  const vectorIcons = require('@expo/vector-icons');
  console.log('Vector icons object:', vectorIcons);
  Ionicons = vectorIcons.Ionicons;
  console.log('Ionicons:', Ionicons);
} catch (error) {
  console.error('Error importing Ionicons:', error);
  iconError = error.message;
}

export default function IconTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Icon Import Test</Text>
      
      {iconError ? (
        <Text style={styles.error}>Error: {iconError}</Text>
      ) : (
        <Text style={styles.success}>Icons imported successfully!</Text>
      )}
      
      {Ionicons && (
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>Testing Ionicons:</Text>
          <Ionicons name="home" size={24} color="white" />
        </View>
      )}
      
      <Text style={styles.fallback}>Fallback: 🏠 🔍 💪</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
  },
  error: {
    color: '#ff4444',
    marginBottom: 20,
  },
  success: {
    color: '#44ff44',
    marginBottom: 20,
  },
  iconContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  iconText: {
    color: 'white',
    marginBottom: 10,
  },
  fallback: {
    color: 'white',
    fontSize: 24,
    marginTop: 20,
  },
});