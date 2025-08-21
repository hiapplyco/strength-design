import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signOut, updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import healthService from '../services/healthService';
import sessionContextManager from '../services/sessionContextManager';
import { useTheme } from '../contexts/ThemeContext';
import { GlassContainer, GlassCard } from '../components/GlassmorphismComponents';
import BiometricSettings from '../components/BiometricSettings';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalContextButton from '../components/GlobalContextButton';
import GlobalContextStatusLine from '../components/GlobalContextStatusLine';

export default function ProfileScreen({ navigation }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const neonAnim = useRef(new Animated.Value(0)).current;
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

  const [biometricModalVisible, setBiometricModalVisible] = useState(false);
  const [biometricData, setBiometricData] = useState({});

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    // Start neon animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(neonAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(neonAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
    
    loadUserData();
    loadSettings();
    checkHealthStatus();
    loadBiometricData();
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
      const summary = await healthService.getTodaysSummary();
      setHealthStatus({
        connected: healthService.isInitialized,
        lastSync: healthService.lastSyncTime,
        permissions: healthService.permissions.read
      });
    } catch (error) {
      console.error('Error checking health status:', error);
    }
  };

  const loadBiometricData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.exists() ? userDoc.data() : {};
        setBiometricData(data.biometrics || {});
      }
    } catch (error) {
      console.error('Error loading biometric data:', error);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      // Initialize session manager and track screen visit
      await sessionContextManager.initialize();
      await sessionContextManager.trackScreenVisit('Profile');
      
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
        
        // Update session context with comprehensive profile data
        await sessionContextManager.updateBiometrics({
          height: userData.height,
          weight: userData.weight,
          age: userData.age,
          gender: userData.gender,
          experienceLevel: userData.experienceLevel,
          bio: userData.bio,
          displayName: userData.displayName,
          measurementUnit: settings.measurementUnit || 'metric'
        }, 'profile_save');
        
        await sessionContextManager.updatePreferences({
          fitnessGoals: userData.fitnessGoals,
          preferredWorkoutDays: userData.preferredWorkoutDays,
          injuries: userData.injuries,
          experienceLevel: userData.experienceLevel,
          measurementUnit: settings.measurementUnit || 'metric',
          healthSync: settings.healthSync,
          shareDataWithAI: settings.shareDataWithAI
        }, 'profile_save');
        
        // Clear existing goals and add current fitness goals
        if (userData.fitnessGoals) {
          await sessionContextManager.addGoals([{
            name: userData.fitnessGoals,
            source: 'profile_save',
            priority: 'high',
            updatedAt: Date.now()
          }], 'profile_save');
        }
        
        // Fetch and update health data if health sync is enabled
        if (settings.healthSync && healthService.isInitialized) {
          try {
            const healthSummary = await healthService.getTodaysSummary();
            if (healthSummary) {
              // Add health data to biometrics context
              await sessionContextManager.updateBiometrics({
                ...userData,
                healthData: {
                  steps: healthSummary.steps,
                  calories: healthSummary.calories,
                  workouts: healthSummary.workouts,
                  lastSync: healthSummary.lastSync,
                  isConnected: true
                }
              }, 'profile_health');
            }
          } catch (healthError) {
            console.warn('Could not fetch health data during profile save:', healthError);
          }
        }
        
        console.log('✅ Profile saved and session context updated');
        
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
      
      // Update session context with new settings preferences
      await sessionContextManager.initialize();
      await sessionContextManager.updatePreferences({
        healthSync: settings.healthSync,
        shareDataWithAI: settings.shareDataWithAI,
        measurementUnit: settings.measurementUnit,
        workoutReminders: settings.workoutReminders,
        motivationalMessages: settings.motivationalMessages,
        syncInterval: settings.syncInterval,
        notificationSettings: {
          workoutReminders: settings.workoutReminders,
          restDayReminders: settings.restDayReminders,
          motivationalMessages: settings.motivationalMessages,
          progressUpdates: settings.progressUpdates
        }
      }, 'settings_save');
      
      console.log('✅ Settings saved and session context updated');
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

  const handleBiometricSave = async (newBiometricData) => {
    try {
      setBiometricData(newBiometricData);
      
      // Update user data with basic info from biometrics
      const updatedUserData = {
        ...userData,
        age: newBiometricData.age || userData.age,
        height: newBiometricData.height || userData.height,
        weight: newBiometricData.weight || userData.weight,
        gender: newBiometricData.gender || userData.gender,
        injuries: newBiometricData.injuries || userData.injuries,
      };
      setUserData(updatedUserData);
      
      // Save biometric data to Firestore
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          ...updatedUserData,
          biometrics: newBiometricData,
          biometricsUpdatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        // Immediately update session context with comprehensive biometric data
        await sessionContextManager.initialize();
        
        // Update biometrics in session context
        await sessionContextManager.updateBiometrics({
          ...newBiometricData,
          height: updatedUserData.height,
          weight: updatedUserData.weight,
          age: updatedUserData.age,
          gender: updatedUserData.gender,
          experienceLevel: updatedUserData.experienceLevel
        }, 'profile_biometrics');
        
        // Update preferences with any new data
        await sessionContextManager.updatePreferences({
          fitnessGoals: updatedUserData.fitnessGoals,
          preferredWorkoutDays: updatedUserData.preferredWorkoutDays,
          injuries: updatedUserData.injuries,
          experienceLevel: updatedUserData.experienceLevel
        }, 'profile_biometrics');
        
        // Add goals if fitness goals are set
        if (updatedUserData.fitnessGoals) {
          await sessionContextManager.addGoals([{
            name: updatedUserData.fitnessGoals,
            source: 'profile_biometrics',
            priority: 'high',
            addedAt: Date.now()
          }], 'profile_biometrics');
        }
        
        // If weight changed and health sync is enabled, update health service
        if (newBiometricData.weight && settings.healthSync && settings.syncWeight) {
          const unit = settings.measurementUnit === 'metric' ? 'kg' : 'lbs';
          await healthService.updateWeight(parseFloat(newBiometricData.weight), unit);
        }
        
        console.log('✅ Biometric data saved and session context updated comprehensively');
      }
    } catch (error) {
      console.error('❌ Error saving biometric data:', error);
      Alert.alert('Error', 'Failed to save biometric data');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB86B" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {/* Global Context Status Line */}
      <GlobalContextStatusLine navigation={navigation} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingTop: 0,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* Neon Title */}
            <Animated.Text style={[
              styles.pageTitle,
              {
                color: neonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: theme.isDarkMode ? ['#FFFFFF', '#FF6B35'] : ['#000000', '#FF6B35'],
                }),
                textShadowColor: neonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['transparent', '#FF6B35'],
                }),
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: neonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 30],
                }),
              },
            ]}>
              PROFILE
            </Animated.Text>
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
            
            <Text style={[styles.name, { color: theme.theme.text }]}>{userData.displayName || 'User'}</Text>
            <Text style={[styles.email, { color: theme.theme.textSecondary }]}>{userData.email}</Text>
            
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditMode(!editMode)}
            >
              <Text style={styles.editButtonText}>
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Text>
            </TouchableOpacity>
          </View>
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
        {/* Neon Section Divider */}
        <View style={styles.sectionDivider}>
          <View style={styles.neonLine} />
          <Text style={styles.sectionDividerText}>HEALTH INTEGRATION</Text>
          <View style={styles.neonLine} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.theme.text }]}>Health Integration</Text>
        
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
        <View style={styles.sectionDivider}>
          <View style={styles.neonLine} />
          <Text style={styles.sectionDividerText}>NOTIFICATIONS</Text>
          <View style={styles.neonLine} />
        </View>
        
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
        <View style={styles.sectionDivider}>
          <View style={styles.neonLine} />
          <Text style={styles.sectionDividerText}>PRIVACY</Text>
          <View style={styles.neonLine} />
        </View>
        
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
        <View style={styles.sectionDivider}>
          <View style={styles.neonLine} />
          <Text style={styles.sectionDividerText}>DISPLAY</Text>
          <View style={styles.neonLine} />
        </View>
        
        {/* Theme Toggle */}
        <View style={styles.settingRowColumn}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.theme.text }]}>Theme</Text>
            <Text style={[styles.settingDescription, { color: theme.theme.textSecondary }]}>Choose your preferred appearance</Text>
          </View>
          <View style={styles.themeSelector}>
            {['light', 'dark', 'system'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeOption,
                  theme.themeMode === mode && styles.themeOptionActive,
                  { 
                    backgroundColor: theme.themeMode === mode 
                      ? theme.theme.primary 
                      : theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: theme.themeMode === mode 
                      ? theme.theme.primary 
                      : theme.isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                  }
                ]}
                onPress={() => theme.changeTheme(mode)}
              >
                <Ionicons 
                  name={mode === 'light' ? 'sunny' : mode === 'dark' ? 'moon' : 'phone-portrait'} 
                  size={16} 
                  color={theme.themeMode === mode ? '#FFFFFF' : theme.theme.textSecondary} 
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: theme.themeMode === mode ? '#FFFFFF' : theme.theme.textSecondary }
                  ]}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.settingRowColumn}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.theme.text }]}>Measurement Unit</Text>
            <Text style={[styles.settingDescription, { color: theme.theme.textSecondary }]}>Choose your preferred measurement system</Text>
          </View>
          <View style={styles.compactSegmentedControl}>
            {['metric', 'imperial'].map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.compactSegment,
                  settings.measurementUnit === unit && styles.segmentActive
                ]}
                onPress={() => setSettings({ ...settings, measurementUnit: unit })}
              >
                <Text
                  style={[
                    styles.compactSegmentText,
                    settings.measurementUnit === unit && styles.segmentTextActive
                  ]}
                >
                  {unit === 'metric' ? 'kg' : 'lb'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Biometric Settings */}
      <View style={styles.section}>
        <View style={styles.sectionDivider}>
          <View style={styles.neonLine} />
          <Text style={styles.sectionDividerText}>BIOMETRIC DATA</Text>
          <View style={styles.neonLine} />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.theme.text }]}>Body Metrics & Goals</Text>
            <Text style={[styles.settingDescription, { color: theme.theme.textSecondary }]}>
              Manage your body composition, performance data, and fitness goals
            </Text>
            {Object.keys(biometricData).length > 0 && (
              <Text style={styles.statusText}>
                Last updated: {biometricData.biometricsUpdatedAt ? new Date(biometricData.biometricsUpdatedAt).toLocaleDateString() : 'Never'}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setBiometricModalVisible(true)}
          >
            <Ionicons name="analytics" size={20} color="#FFB86B" />
          </TouchableOpacity>
        </View>

        {Object.keys(biometricData).length > 0 && (
          <View style={styles.biometricSummary}>
            <Text style={[styles.subSectionTitle, { color: theme.theme.textSecondary }]}>Quick Stats</Text>
            <View style={styles.statsRow}>
              {biometricData.age && (
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.theme.text }]}>{biometricData.age}</Text>
                  <Text style={[styles.statLabel, { color: theme.theme.textSecondary }]}>Age</Text>
                </View>
              )}
              {biometricData.bmi && (
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.theme.text }]}>{biometricData.bmi}</Text>
                  <Text style={[styles.statLabel, { color: theme.theme.textSecondary }]}>BMI</Text>
                </View>
              )}
              {biometricData.bodyFatPercentage && (
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.theme.text }]}>{biometricData.bodyFatPercentage}%</Text>
                  <Text style={[styles.statLabel, { color: theme.theme.textSecondary }]}>Body Fat</Text>
                </View>
              )}
              {biometricData.restingHeartRate && (
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.theme.text }]}>{biometricData.restingHeartRate}</Text>
                  <Text style={[styles.statLabel, { color: theme.theme.textSecondary }]}>RHR</Text>
                </View>
              )}
            </View>
            
            {biometricData.fitnessGoals && biometricData.fitnessGoals.length > 0 && (
              <View style={styles.goalsPreview}>
                <Text style={[styles.goalsLabel, { color: theme.theme.textSecondary }]}>Goals:</Text>
                <Text style={[styles.goalsText, { color: theme.theme.text }]}>
                  {biometricData.fitnessGoals.map(goal => goal.replace('_', ' ')).join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <View style={styles.sectionDivider}>
          <View style={styles.neonLine} />
          <Text style={styles.sectionDividerText}>ACCOUNT</Text>
          <View style={styles.neonLine} />
        </View>
        
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

      {/* Biometric Settings Modal */}
      <BiometricSettings
        visible={biometricModalVisible}
        onClose={() => setBiometricModalVisible(false)}
        onSave={handleBiometricSave}
        initialData={{
          ...biometricData,
          age: userData.age || biometricData.age,
          height: userData.height || biometricData.height,
          weight: userData.weight || biometricData.weight,
          gender: userData.gender || biometricData.gender,
          injuries: userData.injuries || biometricData.injuries,
        }}
      />
      
      {/* Global Context Button */}
      <GlobalContextButton navigation={navigation} position="bottom-right" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontFamily: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif-black',
      default: 'System',
    }),
    textAlign: 'center',
  },
  settingRowColumn: {
    flexDirection: 'column',
    paddingVertical: 10,
  },
  themeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    justifyContent: 'center',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    flex: 1,
    maxWidth: 110,
    justifyContent: 'center',
  },
  themeOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 11,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0B0D',
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginHorizontal: 15,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1B1E',
  },
  headerContent: {
    alignItems: 'center',
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
    marginHorizontal: 15,
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
    flexShrink: 1,
  },
  compactSegmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#1A1B1E',
    borderRadius: 10,
    padding: 2,
    marginTop: 8,
    alignSelf: 'center',
    minWidth: 100,
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 0,
  },
  compactSegment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 40,
  },
  segmentActive: {
    backgroundColor: '#FFB86B',
  },
  segmentText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  compactSegmentText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
  settingsButton: {
    padding: 8,
  },
  biometricSummary: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2A2B2E',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  goalsPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  goalsLabel: {
    fontSize: 13,
    marginRight: 8,
    fontWeight: '600',
  },
  goalsText: {
    fontSize: 13,
    flex: 1,
    textTransform: 'capitalize',
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  neonLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  sectionDividerText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: 15,
    textShadowColor: '#FF6B35',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});