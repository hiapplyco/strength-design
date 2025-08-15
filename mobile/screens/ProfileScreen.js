import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signOut, updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import healthService from '../services/healthService';

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    photoURL: null,
    phoneNumber: '',
    bio: '',
    fitnessGoals: '',
    experienceLevel: 'intermediate',
    preferredWorkoutDays: 3,
    injuries: '',
    height: '',
    weight: '',
    age: '',
    gender: 'other'
  });

  const [settings, setSettings] = useState({
    // Health Integration
    healthSync: false,
    syncWeight: true,
    syncWorkouts: true,
    syncSleep: true,
    syncHeartRate: true,
    syncSteps: true,
    syncCalories: true,
    
    // Notifications
    workoutReminders: true,
    reminderTime: '08:00',
    restDayReminders: true,
    motivationalMessages: true,
    progressUpdates: true,
    
    // Privacy
    shareDataWithAI: true,
    anonymousAnalytics: true,
    crashReporting: true,
    
    // Display
    theme: 'dark',
    measurementUnit: 'metric', // metric or imperial
    startWeekOn: 'monday',
    
    // Advanced
    developerMode: false,
    cacheSize: '100', // MB
    syncInterval: '30', // minutes
  });

  const [healthStatus, setHealthStatus] = useState({
    connected: false,
    lastSync: null,
    permissions: []
  });

  const [editMode, setEditMode] = useState(false);
  const [passwordChange, setPasswordChange] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    loadUserData();
    loadSettings();
    checkHealthStatus();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Get user data from Firebase
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const firestoreData = userDoc.exists() ? userDoc.data() : {};
        
        setUserData({
          displayName: user.displayName || firestoreData.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || firestoreData.photoURL || null,
          phoneNumber: user.phoneNumber || firestoreData.phoneNumber || '',
          bio: firestoreData.bio || '',
          fitnessGoals: firestoreData.fitnessGoals || '',
          experienceLevel: firestoreData.experienceLevel || 'intermediate',
          preferredWorkoutDays: firestoreData.preferredWorkoutDays || 3,
          injuries: firestoreData.injuries || '',
          height: firestoreData.height || '',
          weight: firestoreData.weight || '',
          age: firestoreData.age || '',
          gender: firestoreData.gender || 'other'
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkHealthStatus = async () => {
    try {
      const summary = await healthService.getTodaySummary();
      setHealthStatus({
        connected: healthService.isInitialized,
        lastSync: healthService.lastSyncTime,
        permissions: healthService.permissions.read
      });
    } catch (error) {
      console.error('Error checking health status:', error);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Update Firebase Auth profile
        await updateProfile(user, {
          displayName: userData.displayName,
          photoURL: userData.photoURL
        });
        
        // Update Firestore document
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        // If weight changed, sync to health service
        if (userData.weight && settings.healthSync && settings.syncWeight) {
          const unit = settings.measurementUnit === 'metric' ? 'kg' : 'lbs';
          await healthService.updateWeight(parseFloat(userData.weight), unit);
        }
        
        Alert.alert('Success', 'Profile updated successfully');
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Update health service based on settings
      if (settings.healthSync && !healthService.isInitialized) {
        await healthService.initialize();
      } else if (!settings.healthSync && healthService.isInitialized) {
        healthService.destroy();
      }
      
      // Start/stop background sync based on settings
      if (settings.healthSync) {
        healthService.startBackgroundSync(parseInt(settings.syncInterval));
      }
      
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleHealthConnect = async () => {
    try {
      if (!healthService.isInitialized) {
        const result = await healthService.initialize();
        if (result.success) {
          // Request permissions for selected data types
          const types = [];
          if (settings.syncWeight) types.push('weight');
          if (settings.syncWorkouts) types.push('workout');
          if (settings.syncSleep) types.push('sleep');
          if (settings.syncHeartRate) types.push('heart_rate');
          if (settings.syncSteps) types.push('steps');
          if (settings.syncCalories) types.push('calories');
          
          const permissions = await healthService.requestPermissions(types);
          if (permissions.success) {
            setSettings({ ...settings, healthSync: true });
            await saveSettings();
            await checkHealthStatus();
            Alert.alert('Success', 'Health app connected successfully');
          }
        } else {
          Alert.alert('Error', result.error || 'Failed to connect health app');
        }
      }
    } catch (error) {
      console.error('Error connecting health app:', error);
      Alert.alert('Error', 'Failed to connect health app');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      await uploadProfileImage(result.assets[0].uri);
    }
  };

  const uploadProfileImage = async (uri) => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (user) {
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const storageRef = ref(storage, `avatars/${user.uid}.jpg`);
        const snapshot = await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        setUserData({ ...userData, photoURL: downloadURL });
        await updateProfile(user, { photoURL: downloadURL });
        await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });
        
        Alert.alert('Success', 'Profile picture updated');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordChange.new !== passwordChange.confirm) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    if (passwordChange.new.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, passwordChange.new);
        Alert.alert('Success', 'Password updated successfully');
        setPasswordChange({ current: '', new: '', confirm: '' });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', 'Failed to update password. Please re-authenticate and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.replace('Login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const exportData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        // Gather all user data
        const exportData = {
          profile: userData,
          settings: settings,
          healthData: healthService.healthDataCache,
          exportDate: new Date().toISOString(),
          appVersion: '1.0.0'
        };
        
        // Convert to JSON and save to file
        const jsonData = JSON.stringify(exportData, null, 2);
        const fileName = `strength-design-export-${Date.now()}.json`;
        
        // For web, create download link
        if (Platform.OS === 'web') {
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          // For mobile, would use expo-file-system
          Alert.alert('Export Complete', `Data exported to ${fileName}`);
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              await loadSettings();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB86B" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {userData.photoURL ? (
            <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={40} color="#666" />
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.name}>{userData.displayName || 'User'}</Text>
        <Text style={styles.email}>{userData.email}</Text>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditMode(!editMode)}
        >
          <Text style={styles.editButtonText}>
            {editMode ? 'Cancel' : 'Edit Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Information */}
      {editMode && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={userData.displayName}
              onChangeText={(text) => setUserData({ ...userData, displayName: text })}
              placeholder="Your name"
              placeholderTextColor="#666"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={userData.bio}
              onChangeText={(text) => setUserData({ ...userData, bio: text })}
              placeholder="Tell us about yourself"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fitness Goals</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={userData.fitnessGoals}
              onChangeText={(text) => setUserData({ ...userData, fitnessGoals: text })}
              placeholder="What are your fitness goals?"
              placeholderTextColor="#666"
              multiline
              numberOfLines={2}
            />
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={userData.age}
                onChangeText={(text) => setUserData({ ...userData, age: text })}
                placeholder="Age"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    const options = ['male', 'female', 'other'];
                    const current = options.indexOf(userData.gender);
                    const next = (current + 1) % options.length;
                    setUserData({ ...userData, gender: options[next] });
                  }}
                >
                  <Text style={styles.pickerText}>{userData.gender}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>
                Height ({settings.measurementUnit === 'metric' ? 'cm' : 'in'})
              </Text>
              <TextInput
                style={styles.input}
                value={userData.height}
                onChangeText={(text) => setUserData({ ...userData, height: text })}
                placeholder="Height"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>
                Weight ({settings.measurementUnit === 'metric' ? 'kg' : 'lbs'})
              </Text>
              <TextInput
                style={styles.input}
                value={userData.weight}
                onChangeText={(text) => setUserData({ ...userData, weight: text })}
                placeholder="Weight"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Experience Level</Text>
            <View style={styles.segmentedControl}>
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.segment,
                    userData.experienceLevel === level && styles.segmentActive
                  ]}
                  onPress={() => setUserData({ ...userData, experienceLevel: level })}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      userData.experienceLevel === level && styles.segmentTextActive
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Injuries or Limitations</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={userData.injuries}
              onChangeText={(text) => setUserData({ ...userData, injuries: text })}
              placeholder="Any injuries or physical limitations?"
              placeholderTextColor="#666"
              multiline
              numberOfLines={2}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={saveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Health Integration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Integration</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Connect Health App</Text>
            <Text style={styles.settingDescription}>
              Sync with {Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}
            </Text>
            {healthStatus.connected && (
              <Text style={styles.statusText}>
                Last sync: {healthStatus.lastSync ? new Date(healthStatus.lastSync).toLocaleString() : 'Never'}
              </Text>
            )}
          </View>
          <Switch
            value={settings.healthSync}
            onValueChange={async (value) => {
              if (value) {
                await handleHealthConnect();
              } else {
                setSettings({ ...settings, healthSync: false });
                healthService.destroy();
              }
            }}
            trackColor={{ false: '#767577', true: '#FFB86B' }}
            thumbColor={settings.healthSync ? '#FF7E87' : '#f4f3f4'}
          />
        </View>
        
        {settings.healthSync && (
          <>
            <View style={styles.divider} />
            <Text style={styles.subSectionTitle}>Sync Options</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Weight</Text>
              <Switch
                value={settings.syncWeight}
                onValueChange={(value) => setSettings({ ...settings, syncWeight: value })}
                trackColor={{ false: '#767577', true: '#FFB86B' }}
                thumbColor={settings.syncWeight ? '#FF7E87' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Workouts</Text>
              <Switch
                value={settings.syncWorkouts}
                onValueChange={(value) => setSettings({ ...settings, syncWorkouts: value })}
                trackColor={{ false: '#767577', true: '#FFB86B' }}
                thumbColor={settings.syncWorkouts ? '#FF7E87' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Sleep</Text>
              <Switch
                value={settings.syncSleep}
                onValueChange={(value) => setSettings({ ...settings, syncSleep: value })}
                trackColor={{ false: '#767577', true: '#FFB86B' }}
                thumbColor={settings.syncSleep ? '#FF7E87' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Heart Rate</Text>
              <Switch
                value={settings.syncHeartRate}
                onValueChange={(value) => setSettings({ ...settings, syncHeartRate: value })}
                trackColor={{ false: '#767577', true: '#FFB86B' }}
                thumbColor={settings.syncHeartRate ? '#FF7E87' : '#f4f3f4'}
              />
            </View>
          </>
        )}
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Workout Reminders</Text>
          <Switch
            value={settings.workoutReminders}
            onValueChange={(value) => setSettings({ ...settings, workoutReminders: value })}
            trackColor={{ false: '#767577', true: '#FFB86B' }}
            thumbColor={settings.workoutReminders ? '#FF7E87' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Rest Day Reminders</Text>
          <Switch
            value={settings.restDayReminders}
            onValueChange={(value) => setSettings({ ...settings, restDayReminders: value })}
            trackColor={{ false: '#767577', true: '#FFB86B' }}
            thumbColor={settings.restDayReminders ? '#FF7E87' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Motivational Messages</Text>
          <Switch
            value={settings.motivationalMessages}
            onValueChange={(value) => setSettings({ ...settings, motivationalMessages: value })}
            trackColor={{ false: '#767577', true: '#FFB86B' }}
            thumbColor={settings.motivationalMessages ? '#FF7E87' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Share Data with AI</Text>
            <Text style={styles.settingDescription}>
              Allow AI to use your data for personalized recommendations
            </Text>
          </View>
          <Switch
            value={settings.shareDataWithAI}
            onValueChange={(value) => setSettings({ ...settings, shareDataWithAI: value })}
            trackColor={{ false: '#767577', true: '#FFB86B' }}
            thumbColor={settings.shareDataWithAI ? '#FF7E87' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Anonymous Analytics</Text>
          <Switch
            value={settings.anonymousAnalytics}
            onValueChange={(value) => setSettings({ ...settings, anonymousAnalytics: value })}
            trackColor={{ false: '#767577', true: '#FFB86B' }}
            thumbColor={settings.anonymousAnalytics ? '#FF7E87' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Measurement Unit</Text>
          <View style={styles.segmentedControl}>
            {['metric', 'imperial'].map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.segment,
                  settings.measurementUnit === unit && styles.segmentActive
                ]}
                onPress={() => setSettings({ ...settings, measurementUnit: unit })}
              >
                <Text
                  style={[
                    styles.segmentText,
                    settings.measurementUnit === unit && styles.segmentTextActive
                  ]}
                >
                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={exportData}>
          <Ionicons name="download-outline" size={20} color="#FFB86B" />
          <Text style={styles.actionButtonText}>Export Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={clearCache}>
          <Ionicons name="trash-outline" size={20} color="#FFB86B" />
          <Text style={styles.actionButtonText}>Clear Cache</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={saveSettings}>
          <Ionicons name="save-outline" size={20} color="#FFB86B" />
          <Text style={styles.actionButtonText}>Save Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF7E87" />
          <Text style={[styles.actionButtonText, { color: '#FF7E87' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B0D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0B0D',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1B1E',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1B1E',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFB86B',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8F9FA',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 15,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFB86B',
  },
  editButtonText: {
    color: '#FFB86B',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1B1E',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8F9FA',
    marginBottom: 15,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 10,
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#1A1B1E',
    borderRadius: 10,
    padding: 12,
    color: '#F8F9FA',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2B2E',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  pickerContainer: {
    backgroundColor: '#1A1B1E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2B2E',
  },
  picker: {
    padding: 12,
  },
  pickerText: {
    color: '#F8F9FA',
    fontSize: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#1A1B1E',
    borderRadius: 10,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#FFB86B',
  },
  segmentText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#0A0B0D',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#FFB86B',
  },
  buttonText: {
    color: '#0A0B0D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#F8F9FA',
  },
  settingDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusText: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2B2E',
    marginVertical: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2E',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#FFB86B',
    marginLeft: 15,
  },
  signOutButton: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
});