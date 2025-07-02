import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Account Information
          </Text>
          <Text className="text-gray-600">Email: {user?.email}</Text>
        </View>

        <TouchableOpacity
          className="bg-red-500 rounded-lg py-3"
          onPress={signOut}
        >
          <Text className="text-white text-center font-semibold">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}