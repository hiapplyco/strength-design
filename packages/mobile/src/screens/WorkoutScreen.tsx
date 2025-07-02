import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

export function WorkoutScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Workouts
        </Text>
        
        <TouchableOpacity className="bg-primary rounded-lg p-4 mb-4">
          <Text className="text-white text-center font-semibold text-lg">
            Generate New Workout
          </Text>
        </TouchableOpacity>

        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Your Workouts
          </Text>
          <Text className="text-gray-600">No workouts created yet</Text>
        </View>
      </View>
    </ScrollView>
  );
}