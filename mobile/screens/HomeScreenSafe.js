import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeIcon } from '../services/IconService';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        style={styles.header}
      >
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.logo}>💪 Strength.Design</Text>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Generator')}
        >
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.cardGradient}
          >
            <SafeIcon name="sparkles" size={40} color="white" />
            <Text style={styles.cardTitle}>Generate Workout</Text>
            <Text style={styles.cardText}>AI-powered workout creation</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Workouts')}
        >
          <View style={styles.cardContent}>
            <SafeIcon name="calendar" size={40} color="#FF6B35" />
            <Text style={styles.cardTitleDark}>My Workouts</Text>
            <Text style={styles.cardTextDark}>View saved workout plans</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Search')}
        >
          <View style={styles.cardContent}>
            <SafeIcon name="search" size={40} color="#FF6B35" />
            <Text style={styles.cardTitleDark}>Intelligent Search</Text>
            <Text style={styles.cardTextDark}>Find exercises & nutrition</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  welcomeText: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  cardContent: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  cardTitleDark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  cardText: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
  },
  cardTextDark: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
});