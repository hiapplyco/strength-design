import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * HealthService - Unified health data integration for Apple Health & Google Fit
 * Provides cross-platform health data sync with fallback for web
 */
class HealthService {
  constructor() {
    this.isInitialized = false;
    this.platform = Platform.OS;
    this.healthDataCache = {};
    this.syncInterval = null;
    this.lastSyncTime = null;
    
    // Health data types we track
    this.dataTypes = {
      WORKOUT: 'workout',
      WEIGHT: 'weight',
      SLEEP: 'sleep',
      HEART_RATE: 'heart_rate',
      STEPS: 'steps',
      CALORIES: 'calories',
      WATER: 'water',
      NUTRITION: 'nutrition'
    };
    
    // Permission status
    this.permissions = {
      read: [],
      write: []
    };
  }

  /**
   * Initialize health service with platform-specific setup
   */
  async initialize() {
    try {
      console.log('[HealthService] Initializing for platform:', this.platform);
      
      // Load cached health data
      await this.loadCachedData();
      
      // Platform-specific initialization
      if (this.platform === 'ios') {
        await this.initializeHealthKit();
      } else if (this.platform === 'android') {
        await this.initializeGoogleFit();
      } else {
        // Web fallback - use local storage
        console.log('[HealthService] Running in web mode - using local storage');
      }
      
      this.isInitialized = true;
      
      // Start background sync
      this.startBackgroundSync();
      
      return { success: true };
    } catch (error) {
      console.error('[HealthService] Initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize Apple HealthKit (iOS)
   */
  async initializeHealthKit() {
    // Note: Requires react-native-health package
    // This is a placeholder for when running on actual iOS device
    console.log('[HealthService] HealthKit initialization placeholder');
    
    // When implemented with react-native-health:
    // const AppleHealthKit = require('react-native-health').default;
    // 
    // const permissions = {
    //   permissions: {
    //     read: [
    //       AppleHealthKit.Constants.Permissions.Weight,
    //       AppleHealthKit.Constants.Permissions.Steps,
    //       AppleHealthKit.Constants.Permissions.HeartRate,
    //       AppleHealthKit.Constants.Permissions.Sleep,
    //       AppleHealthKit.Constants.Permissions.Workout,
    //       AppleHealthKit.Constants.Permissions.ActiveEnergyBurned
    //     ],
    //     write: [
    //       AppleHealthKit.Constants.Permissions.Weight,
    //       AppleHealthKit.Constants.Permissions.Workout,
    //       AppleHealthKit.Constants.Permissions.ActiveEnergyBurned
    //     ]
    //   }
    // };
    // 
    // AppleHealthKit.initHealthKit(permissions, (error) => {
    //   if (!error) {
    //     this.permissions.read = permissions.permissions.read;
    //     this.permissions.write = permissions.permissions.write;
    //   }
    // });
  }

  /**
   * Initialize Google Fit (Android)
   */
  async initializeGoogleFit() {
    // Note: Requires react-native-google-fit package
    // This is a placeholder for when running on actual Android device
    console.log('[HealthService] Google Fit initialization placeholder');
    
    // When implemented with react-native-google-fit:
    // const GoogleFit = require('react-native-google-fit').default;
    // 
    // const options = {
    //   scopes: [
    //     GoogleFit.Scopes.FITNESS_ACTIVITY_READ,
    //     GoogleFit.Scopes.FITNESS_ACTIVITY_WRITE,
    //     GoogleFit.Scopes.FITNESS_BODY_READ,
    //     GoogleFit.Scopes.FITNESS_BODY_WRITE,
    //   ],
    // };
    // 
    // GoogleFit.authorize(options)
    //   .then(authResult => {
    //     if (authResult.success) {
    //       GoogleFit.startRecording((callback) => {
    //         // Process data
    //       });
    //     }
    //   });
  }

  /**
   * Request health data permissions
   */
  async requestPermissions(types = []) {
    try {
      console.log('[HealthService] Requesting permissions for:', types);
      
      if (this.platform === 'web') {
        // Web doesn't need permissions
        return { success: true, granted: types };
      }
      
      // Platform-specific permission requests would go here
      // For now, simulate granting permissions
      const granted = types;
      this.permissions.read = [...new Set([...this.permissions.read, ...granted])];
      
      await this.savePermissions();
      
      return { success: true, granted };
    } catch (error) {
      console.error('[HealthService] Permission request failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync workout data to health platform
   */
  async syncWorkout(workoutData) {
    try {
      console.log('[HealthService] Syncing workout:', workoutData);
      
      const healthData = {
        type: this.dataTypes.WORKOUT,
        timestamp: workoutData.completedAt || new Date().toISOString(),
        duration: workoutData.duration || 0, // in minutes
        calories: workoutData.calories || 0,
        exercises: workoutData.exercises || [],
        notes: workoutData.notes || '',
        metadata: {
          workoutId: workoutData.id,
          workoutName: workoutData.name,
          source: 'strength.design'
        }
      };
      
      // Save to local cache
      await this.saveHealthData(healthData);
      
      // Platform-specific sync
      if (this.platform === 'ios') {
        await this.syncToHealthKit(healthData);
      } else if (this.platform === 'android') {
        await this.syncToGoogleFit(healthData);
      }
      
      return { success: true, data: healthData };
    } catch (error) {
      console.error('[HealthService] Workout sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get health metrics for a date range
   */
  async getHealthMetrics(startDate, endDate, types = []) {
    try {
      console.log('[HealthService] Getting health metrics:', { startDate, endDate, types });
      
      const metrics = {};
      
      for (const type of types) {
        if (this.platform === 'web') {
          // Get from local cache
          metrics[type] = await this.getFromCache(type, startDate, endDate);
        } else {
          // Platform-specific data retrieval
          metrics[type] = await this.getPlatformData(type, startDate, endDate);
        }
      }
      
      return { success: true, data: metrics };
    } catch (error) {
      console.error('[HealthService] Failed to get health metrics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user weight
   */
  async updateWeight(weight, unit = 'kg') {
    try {
      console.log('[HealthService] Updating weight:', weight, unit);
      
      const healthData = {
        type: this.dataTypes.WEIGHT,
        timestamp: new Date().toISOString(),
        value: weight,
        unit: unit,
        metadata: {
          source: 'strength.design',
          manual: true
        }
      };
      
      await this.saveHealthData(healthData);
      
      return { success: true, data: healthData };
    } catch (error) {
      console.error('[HealthService] Weight update failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log water intake
   */
  async logWater(amount, unit = 'ml') {
    try {
      const healthData = {
        type: this.dataTypes.WATER,
        timestamp: new Date().toISOString(),
        value: amount,
        unit: unit,
        metadata: {
          source: 'strength.design'
        }
      };
      
      await this.saveHealthData(healthData);
      
      return { success: true, data: healthData };
    } catch (error) {
      console.error('[HealthService] Water logging failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get today's summary
   */
  async getTodaySummary() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const metrics = await this.getHealthMetrics(
        today.toISOString(),
        tomorrow.toISOString(),
        Object.values(this.dataTypes)
      );
      
      if (!metrics.success) {
        throw new Error(metrics.error);
      }
      
      // Calculate summary
      const summary = {
        steps: this.sumValues(metrics.data[this.dataTypes.STEPS]),
        calories: this.sumValues(metrics.data[this.dataTypes.CALORIES]),
        water: this.sumValues(metrics.data[this.dataTypes.WATER]),
        workouts: metrics.data[this.dataTypes.WORKOUT]?.length || 0,
        lastWeight: this.getLatestValue(metrics.data[this.dataTypes.WEIGHT]),
        avgHeartRate: this.averageValues(metrics.data[this.dataTypes.HEART_RATE]),
        sleep: this.sumValues(metrics.data[this.dataTypes.SLEEP], 'hours')
      };
      
      return { success: true, data: summary };
    } catch (error) {
      console.error('[HealthService] Failed to get today summary:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start background sync
   */
  startBackgroundSync(intervalMinutes = 30) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(async () => {
      await this.performBackgroundSync();
    }, intervalMinutes * 60 * 1000);
    
    console.log('[HealthService] Background sync started, interval:', intervalMinutes, 'minutes');
  }

  /**
   * Perform background sync
   */
  async performBackgroundSync() {
    try {
      console.log('[HealthService] Performing background sync...');
      
      // Get unsycned data from cache
      const unsynced = await this.getUnsyncedData();
      
      if (unsynced.length > 0) {
        console.log('[HealthService] Syncing', unsynced.length, 'items');
        
        for (const item of unsynced) {
          if (this.platform === 'ios') {
            await this.syncToHealthKit(item);
          } else if (this.platform === 'android') {
            await this.syncToGoogleFit(item);
          }
          
          // Mark as synced
          item.synced = true;
          await this.saveHealthData(item);
        }
      }
      
      this.lastSyncTime = new Date().toISOString();
      await AsyncStorage.setItem('health_last_sync', this.lastSyncTime);
      
      console.log('[HealthService] Background sync completed');
    } catch (error) {
      console.error('[HealthService] Background sync failed:', error);
    }
  }

  /**
   * Save health data to local cache
   */
  async saveHealthData(data) {
    try {
      const key = `health_${data.type}_${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      
      // Update in-memory cache
      if (!this.healthDataCache[data.type]) {
        this.healthDataCache[data.type] = [];
      }
      this.healthDataCache[data.type].push(data);
      
      return true;
    } catch (error) {
      console.error('[HealthService] Failed to save health data:', error);
      return false;
    }
  }

  /**
   * Load cached health data
   */
  async loadCachedData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const healthKeys = keys.filter(key => key.startsWith('health_'));
      
      if (healthKeys.length > 0) {
        const items = await AsyncStorage.multiGet(healthKeys);
        
        for (const [key, value] of items) {
          if (value) {
            try {
              const data = JSON.parse(value);
              if (data && data.type) {
                if (!this.healthDataCache[data.type]) {
                  this.healthDataCache[data.type] = [];
                }
                this.healthDataCache[data.type].push(data);
              }
            } catch (parseError) {
              console.warn('[HealthService] Skipping invalid cached item:', key, parseError.message);
              // Remove invalid cached item
              await AsyncStorage.removeItem(key);
            }
          }
        }
      }
      
      console.log('[HealthService] Loaded', healthKeys.length, 'cached health items');
    } catch (error) {
      console.error('[HealthService] Failed to load cached data:', error);
    }
  }

  /**
   * Get data from cache for date range
   */
  async getFromCache(type, startDate, endDate) {
    const data = this.healthDataCache[type] || [];
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return data.filter(item => {
      const timestamp = new Date(item.timestamp).getTime();
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * Get unsynced data from cache
   */
  async getUnsyncedData() {
    const unsynced = [];
    
    for (const type in this.healthDataCache) {
      const items = this.healthDataCache[type] || [];
      unsynced.push(...items.filter(item => !item.synced));
    }
    
    return unsynced;
  }

  /**
   * Save permissions to storage
   */
  async savePermissions() {
    try {
      await AsyncStorage.setItem('health_permissions', JSON.stringify(this.permissions));
    } catch (error) {
      console.error('[HealthService] Failed to save permissions:', error);
    }
  }

  /**
   * Platform-specific data sync methods (placeholders)
   */
  async syncToHealthKit(data) {
    console.log('[HealthService] HealthKit sync placeholder:', data.type);
    // Implementation would use react-native-health
  }

  async syncToGoogleFit(data) {
    console.log('[HealthService] Google Fit sync placeholder:', data.type);
    // Implementation would use react-native-google-fit
  }

  async getPlatformData(type, startDate, endDate) {
    console.log('[HealthService] Platform data retrieval placeholder:', type);
    // Implementation would use platform-specific APIs
    return [];
  }

  /**
   * Helper methods for data processing
   */
  sumValues(data, field = 'value') {
    if (!data || !Array.isArray(data)) return 0;
    return data.reduce((sum, item) => sum + (item[field] || 0), 0);
  }

  averageValues(data, field = 'value') {
    if (!data || !Array.isArray(data) || data.length === 0) return 0;
    return this.sumValues(data, field) / data.length;
  }

  getLatestValue(data, field = 'value') {
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    const sorted = [...data].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0][field];
  }

  /**
   * Biometric data methods
   */
  async getLatestBiometrics() {
    try {
      const biometrics = {};

      // Get latest weight
      const weightData = await this.getData(this.dataTypes.WEIGHT, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
      if (weightData && weightData.length > 0) {
        biometrics.weight = this.getLatestValue(weightData);
      }

      // Get latest heart rate data
      const heartRateData = await this.getData(this.dataTypes.HEART_RATE, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date());
      if (heartRateData && heartRateData.length > 0) {
        biometrics.restingHeartRate = Math.min(...heartRateData.map(hr => hr.value));
      }

      // For demo purposes, provide some mock data
      if (this.platform === 'web') {
        return {
          weight: 75,
          height: 180,
          restingHeartRate: 65,
          bodyFatPercentage: 15,
          ...biometrics
        };
      }

      return biometrics;
    } catch (error) {
      console.error('[HealthService] Error getting latest biometrics:', error);
      return {};
    }
  }

  async updateBiometrics(biometricData) {
    try {
      const updates = [];

      if (biometricData.weight) {
        updates.push(this.updateWeight(biometricData.weight, 'kg'));
      }

      if (biometricData.bodyFatPercentage) {
        updates.push(this.syncData({
          type: 'body_fat_percentage',
          value: biometricData.bodyFatPercentage,
          unit: 'percent',
          timestamp: new Date().toISOString()
        }));
      }

      await Promise.all(updates);
      console.log('[HealthService] Biometric data updated successfully');
      return { success: true };
    } catch (error) {
      console.error('[HealthService] Error updating biometrics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.healthDataCache = {};
    this.isInitialized = false;
  }
}

// Export singleton instance
export default new HealthService();