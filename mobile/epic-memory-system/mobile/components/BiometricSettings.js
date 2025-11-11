import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { GlassContainer, GlassCard } from './GlassmorphismComponents';
import healthService from '../services/healthService';
import { db, auth } from '../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const BiometricSettings = ({ visible, onClose, onSave, initialData = {} }) => {
  const { isDarkMode, theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncingFromHealth, setSyncingFromHealth] = useState(false);

  const [biometrics, setBiometrics] = useState({
    // Basic Info
    age: '',
    height: '',
    weight: '',
    gender: 'other',

    // Body Metrics
    bodyFatPercentage: '',
    bmi: '',
    muscleMass: '',
    waistCircumference: '',
    neckCircumference: '',

    // Performance Metrics
    maxHeartRate: '',
    restingHeartRate: '',
    vo2Max: '',
    lactateThreshold: '',
    maximumPowerOutput: '',

    // Goals
    targetWeight: '',
    targetBodyFat: '',
    fitnessGoals: [],
    timeframe: '3months',

    // Medical Information
    injuries: '',
    medicalConditions: '',
    medications: '',
    limitations: '',
    allergies: '',

    // Health Sync Settings
    syncFromHealthApp: false,
    lastHealthSync: null,
    ...initialData,
  });

  const fitnessGoalOptions = [
    { id: 'weight_loss', label: 'Weight Loss', icon: 'trending-down' },
    { id: 'muscle_gain', label: 'Muscle Gain', icon: 'fitness' },
    { id: 'strength', label: 'Strength Building', icon: 'barbell' },
    { id: 'endurance', label: 'Endurance', icon: 'bicycle' },
    { id: 'flexibility', label: 'Flexibility', icon: 'body' },
    { id: 'general_fitness', label: 'General Fitness', icon: 'heart' },
    { id: 'sport_specific', label: 'Sport Specific', icon: 'american-football' },
    { id: 'rehabilitation', label: 'Rehabilitation', icon: 'medical' },
  ];

  const timeframeOptions = [
    { value: '1month', label: '1 Month' },
    { value: '3months', label: '3 Months' },
    { value: '6months', label: '6 Months' },
    { value: '1year', label: '1 Year' },
    { value: 'ongoing', label: 'Ongoing' },
  ];

  useEffect(() => {
    if (visible && initialData) {
      setBiometrics(prev => ({ ...prev, ...initialData }));
    }
  }, [visible, initialData]);

  const calculateBMI = (weight, height, unit = 'metric') => {
    if (!weight || !height) return '';
    
    let weightKg = parseFloat(weight);
    let heightM = parseFloat(height);

    if (unit === 'imperial') {
      // Convert pounds to kg and inches to meters
      weightKg = weightKg / 2.205;
      heightM = heightM * 0.0254;
    } else {
      // Height in cm to meters
      heightM = heightM / 100;
    }

    const bmi = weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10;
  };

  const calculateMaxHeartRate = (age) => {
    if (!age) return '';
    return Math.round(220 - parseInt(age));
  };

  const syncFromHealthApp = async () => {
    try {
      setSyncingFromHealth(true);

      if (!healthService.isInitialized) {
        const result = await healthService.initialize();
        if (!result.success) {
          Alert.alert('Error', 'Unable to connect to health app');
          return;
        }
      }

      // Request permissions for biometric data
      const permissions = await healthService.requestPermissions([
        'weight', 'height', 'heart_rate', 'body_fat'
      ]);

      if (!permissions.success) {
        Alert.alert('Permission Required', 'Please grant access to health data');
        return;
      }

      // Fetch latest health data
      const healthData = await healthService.getLatestBiometrics();
      
      const updatedBiometrics = { ...biometrics };
      
      if (healthData.weight) {
        updatedBiometrics.weight = healthData.weight.toString();
      }
      if (healthData.height) {
        updatedBiometrics.height = healthData.height.toString();
      }
      if (healthData.restingHeartRate) {
        updatedBiometrics.restingHeartRate = healthData.restingHeartRate.toString();
      }
      if (healthData.bodyFatPercentage) {
        updatedBiometrics.bodyFatPercentage = healthData.bodyFatPercentage.toString();
      }

      // Calculate BMI if we have weight and height
      if (updatedBiometrics.weight && updatedBiometrics.height) {
        updatedBiometrics.bmi = calculateBMI(
          updatedBiometrics.weight, 
          updatedBiometrics.height
        ).toString();
      }

      // Calculate max heart rate if we have age
      if (updatedBiometrics.age) {
        updatedBiometrics.maxHeartRate = calculateMaxHeartRate(updatedBiometrics.age).toString();
      }

      updatedBiometrics.lastHealthSync = new Date().toISOString();
      updatedBiometrics.syncFromHealthApp = true;

      setBiometrics(updatedBiometrics);
      Alert.alert('Success', 'Biometric data synced from health app!');

    } catch (error) {
      console.error('Error syncing from health app:', error);
      Alert.alert('Error', 'Failed to sync data from health app');
    } finally {
      setSyncingFromHealth(false);
    }
  };

  const handleInputChange = (field, value) => {
    const updatedBiometrics = { ...biometrics, [field]: value };

    // Auto-calculate BMI when weight or height changes
    if (field === 'weight' || field === 'height') {
      if (updatedBiometrics.weight && updatedBiometrics.height) {
        updatedBiometrics.bmi = calculateBMI(
          updatedBiometrics.weight, 
          updatedBiometrics.height
        ).toString();
      }
    }

    // Auto-calculate max heart rate when age changes
    if (field === 'age' && value) {
      updatedBiometrics.maxHeartRate = calculateMaxHeartRate(value).toString();
    }

    setBiometrics(updatedBiometrics);
  };

  const toggleFitnessGoal = (goalId) => {
    const currentGoals = biometrics.fitnessGoals || [];
    const updatedGoals = currentGoals.includes(goalId)
      ? currentGoals.filter(id => id !== goalId)
      : [...currentGoals, goalId];
    
    setBiometrics({ ...biometrics, fitnessGoals: updatedGoals });
  };

  const validateForm = () => {
    const errors = [];
    
    if (biometrics.age && (parseInt(biometrics.age) < 13 || parseInt(biometrics.age) > 120)) {
      errors.push('Age must be between 13 and 120');
    }
    
    if (biometrics.weight && parseFloat(biometrics.weight) <= 0) {
      errors.push('Weight must be a positive number');
    }
    
    if (biometrics.height && parseFloat(biometrics.height) <= 0) {
      errors.push('Height must be a positive number');
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Update user document with biometric data
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          biometrics: biometrics,
          biometricsUpdatedAt: new Date().toISOString(),
        });

        // Sync to health service if enabled
        if (biometrics.syncFromHealthApp && healthService.isInitialized) {
          await healthService.updateBiometrics({
            weight: parseFloat(biometrics.weight) || undefined,
            height: parseFloat(biometrics.height) || undefined,
            bodyFatPercentage: parseFloat(biometrics.bodyFatPercentage) || undefined,
          });
        }

        onSave && onSave(biometrics);
        Alert.alert('Success', 'Biometric settings saved successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Error saving biometric settings:', error);
      Alert.alert('Error', 'Failed to save biometric settings');
    } finally {
      setSaving(false);
    }
  };

  const renderInputField = (label, field, placeholder, options = {}) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.input, { 
          backgroundColor: isDarkMode ? '#1A1B1E' : '#F8F9FA',
          borderColor: isDarkMode ? '#2A2B2E' : '#E0E0E0',
          color: theme.text,
        }]}
        value={biometrics[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        {...options}
      />
    </View>
  );

  const renderSection = (title, children) => (
    <GlassCard variant="subtle" style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </GlassCard>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#0A0B0D' : '#FFFFFF' }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDarkMode ? '#2A2B2E' : '#E0E0E0' }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Biometric Settings</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, { opacity: saving ? 0.6 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFB86B" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Health Sync */}
          {renderSection('Health App Integration', (
            <View>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Sync from Health App</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Automatically sync biometric data from your health app
                  </Text>
                  {biometrics.lastHealthSync && (
                    <Text style={styles.lastSyncText}>
                      Last sync: {new Date(biometrics.lastHealthSync).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <Switch
                  value={biometrics.syncFromHealthApp}
                  onValueChange={(value) => setBiometrics({ ...biometrics, syncFromHealthApp: value })}
                  trackColor={{ false: '#767577', true: '#FFB86B' }}
                  thumbColor={biometrics.syncFromHealthApp ? '#FF7E87' : '#f4f3f4'}
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.syncButton, { opacity: syncingFromHealth ? 0.6 : 1 }]}
                onPress={syncFromHealthApp}
                disabled={syncingFromHealth}
              >
                <View style={styles.syncButtonContent}>
                  {syncingFromHealth ? (
                    <ActivityIndicator size="small" color="#FFB86B" />
                  ) : (
                    <Ionicons name="sync" size={20} color="#FFB86B" />
                  )}
                  <Text style={styles.syncButtonText}>
                    {syncingFromHealth ? 'Syncing...' : 'Sync Now'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}

          {/* Basic Information */}
          {renderSection('Basic Information', (
            <View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  {renderInputField('Age', 'age', 'Enter age', { keyboardType: 'numeric' })}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Gender</Text>
                  <TouchableOpacity
                    style={[styles.picker, { 
                      backgroundColor: isDarkMode ? '#1A1B1E' : '#F8F9FA',
                      borderColor: isDarkMode ? '#2A2B2E' : '#E0E0E0',
                    }]}
                    onPress={() => {
                      const options = ['male', 'female', 'other'];
                      const current = options.indexOf(biometrics.gender);
                      const next = (current + 1) % options.length;
                      handleInputChange('gender', options[next]);
                    }}
                  >
                    <Text style={[styles.pickerText, { color: theme.text }]}>
                      {biometrics.gender.charAt(0).toUpperCase() + biometrics.gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  {renderInputField('Height (cm)', 'height', 'Enter height', { keyboardType: 'numeric' })}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  {renderInputField('Weight (kg)', 'weight', 'Enter weight', { keyboardType: 'numeric' })}
                </View>
              </View>

              {biometrics.bmi && (
                <View style={styles.calculatedField}>
                  <Text style={[styles.calculatedLabel, { color: theme.textSecondary }]}>
                    Calculated BMI: {biometrics.bmi}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {/* Body Metrics */}
          {renderSection('Body Composition', (
            <View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  {renderInputField('Body Fat %', 'bodyFatPercentage', 'Enter body fat %', { keyboardType: 'numeric' })}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  {renderInputField('Muscle Mass (kg)', 'muscleMass', 'Enter muscle mass', { keyboardType: 'numeric' })}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  {renderInputField('Waist (cm)', 'waistCircumference', 'Enter waist', { keyboardType: 'numeric' })}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  {renderInputField('Neck (cm)', 'neckCircumference', 'Enter neck', { keyboardType: 'numeric' })}
                </View>
              </View>
            </View>
          ))}

          {/* Performance Metrics */}
          {renderSection('Performance Data', (
            <View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  {renderInputField('Resting HR', 'restingHeartRate', 'Enter resting HR', { keyboardType: 'numeric' })}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Max HR</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: isDarkMode ? '#1A1B1E' : '#F8F9FA',
                      borderColor: isDarkMode ? '#2A2B2E' : '#E0E0E0',
                      color: theme.text,
                      opacity: 0.7
                    }]}
                    value={biometrics.maxHeartRate}
                    onChangeText={(value) => handleInputChange('maxHeartRate', value)}
                    placeholder="Auto-calculated"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  {renderInputField('VO2 Max', 'vo2Max', 'Enter VO2 max', { keyboardType: 'numeric' })}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  {renderInputField('Lactate Threshold', 'lactateThreshold', 'Enter LT', { keyboardType: 'numeric' })}
                </View>
              </View>

              {renderInputField('Max Power Output (W)', 'maximumPowerOutput', 'Enter max power', { keyboardType: 'numeric' })}
            </View>
          ))}

          {/* Goals */}
          {renderSection('Fitness Goals', (
            <View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  {renderInputField('Target Weight (kg)', 'targetWeight', 'Enter target', { keyboardType: 'numeric' })}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  {renderInputField('Target Body Fat %', 'targetBodyFat', 'Enter target %', { keyboardType: 'numeric' })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Timeframe</Text>
                <View style={styles.segmentedControl}>
                  {timeframeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.segment,
                        biometrics.timeframe === option.value && styles.segmentActive
                      ]}
                      onPress={() => handleInputChange('timeframe', option.value)}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          { color: biometrics.timeframe === option.value ? '#0A0B0D' : theme.textSecondary }
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Primary Goals</Text>
                <View style={styles.goalsContainer}>
                  {fitnessGoalOptions.map((goal) => (
                    <TouchableOpacity
                      key={goal.id}
                      style={[
                        styles.goalChip,
                        {
                          backgroundColor: (biometrics.fitnessGoals || []).includes(goal.id)
                            ? '#FFB86B'
                            : isDarkMode ? '#1A1B1E' : '#F8F9FA',
                          borderColor: isDarkMode ? '#2A2B2E' : '#E0E0E0',
                        }
                      ]}
                      onPress={() => toggleFitnessGoal(goal.id)}
                    >
                      <Ionicons
                        name={goal.icon}
                        size={16}
                        color={(biometrics.fitnessGoals || []).includes(goal.id) ? '#0A0B0D' : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.goalChipText,
                          {
                            color: (biometrics.fitnessGoals || []).includes(goal.id)
                              ? '#0A0B0D'
                              : theme.textSecondary
                          }
                        ]}
                      >
                        {goal.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))}

          {/* Medical Information */}
          {renderSection('Medical Information', (
            <View>
              {renderInputField('Injuries', 'injuries', 'List any current or past injuries', { multiline: true, numberOfLines: 3 })}
              {renderInputField('Medical Conditions', 'medicalConditions', 'List any medical conditions', { multiline: true, numberOfLines: 2 })}
              {renderInputField('Medications', 'medications', 'List current medications', { multiline: true, numberOfLines: 2 })}
              {renderInputField('Physical Limitations', 'limitations', 'Describe any physical limitations', { multiline: true, numberOfLines: 3 })}
              {renderInputField('Allergies', 'allergies', 'List any allergies', { multiline: true, numberOfLines: 2 })}
            </View>
          ))}

          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFB86B',
  },
  saveButtonText: {
    color: '#0A0B0D',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
  },
  picker: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  pickerText: {
    fontSize: 16,
  },
  calculatedField: {
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 184, 107, 0.1)',
    borderRadius: 8,
  },
  calculatedLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  lastSyncText: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 4,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFB86B',
    marginTop: 10,
  },
  syncButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncButtonText: {
    color: '#FFB86B',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 12,
    fontWeight: '600',
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  goalChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default BiometricSettings;