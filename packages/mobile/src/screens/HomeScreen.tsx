import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
        </Text>
        
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Today's Workout
          </Text>
          <Text className="text-gray-600 mb-4">
            No workout scheduled for today
          </Text>
          <TouchableOpacity className="bg-primary rounded-lg py-3">
            <Text className="text-white text-center font-semibold">
              Generate Workout
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Recent Activity
          </Text>
          <Text className="text-gray-600">No recent activity</Text>
        </View>
      </View>
    </ScrollView>
  );
}