/**
 * Battery Optimizer Utility
 * Battery-aware processing optimization for pose analysis
 *
 * Features:
 * - Battery level monitoring
 * - Power mode detection
 * - Thermal throttling detection
 * - Adaptive processing intensity
 * - Charging state optimization
 * - Battery drain prediction
 */

import { Platform, AppState } from 'react-native';
import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import performanceMonitor from '../services/performanceMonitor';
import memoryManager from './memoryManager';

// Battery optimization constants
const BATTERY_CHECK_INTERVAL = 30000; // Check every 30 seconds
const LOW_BATTERY_THRESHOLD = 0.2; // 20% battery
const CRITICAL_BATTERY_THRESHOLD = 0.1; // 10% battery
const MAX_DRAIN_RATE = 0.05; // 5% per hour maximum
const THERMAL_CHECK_INTERVAL = 10000; // Check thermal state every 10 seconds

// Storage keys
const BATTERY_STATS_KEY = '@battery_optimization_stats';
const POWER_SETTINGS_KEY = '@power_optimization_settings';

// Power modes
const PowerMode = {
  HIGH_PERFORMANCE: 'high_performance',
  BALANCED: 'balanced',
  POWER_SAVER: 'power_saver',
  ULTRA_POWER_SAVER: 'ultra_power_saver'
};

// Battery states
const BatteryOptimizationState = {
  OPTIMAL: 'optimal',
  CONSERVATIVE: 'conservative',
  CRITICAL: 'critical',
  CHARGING_BOOST: 'charging_boost'
};

// Processing intensity levels
const ProcessingIntensity = {
  FULL: 1.0,
  HIGH: 0.75,
  MEDIUM: 0.5,
  LOW: 0.25,
  MINIMAL: 0.1
};

// Thermal states
const ThermalState = {
  NORMAL: 'normal',
  WARM: 'warm',
  HOT: 'hot',
  CRITICAL: 'critical'
};

class BatteryOptimizer {
  constructor() {
    this.batteryLevel = 1.0;
    this.batteryState = Battery.BatteryState.UNKNOWN;
    this.powerMode = PowerMode.BALANCED;
    this.optimizationState = BatteryOptimizationState.OPTIMAL;
    this.processingIntensity = ProcessingIntensity.FULL;
    this.thermalState = ThermalState.NORMAL;
    this.isMonitoring = false;
    this.batteryCheckTimer = null;
    this.thermalCheckTimer = null;
    this.batteryHistory = [];
    this.drainRate = 0;
    this.lastBatteryCheck = null;
    this.listeners = new Map();
    this.settings = {
      autoPowerMode: true,
      thermalThrottling: true,
      chargingBoost: true,
      aggressivePowerSaving: false,
      targetDrainRate: MAX_DRAIN_RATE
    };
  }

  /**
   * Initialize battery optimizer
   */
  async initialize() {
    try {
      // Load saved settings
      await this.loadSettings();

      // Get initial battery state
      await this.updateBatteryState();

      // Start monitoring
      this.startMonitoring();

      console.log('BatteryOptimizer: Initialized', {
        batteryLevel: Math.round(this.batteryLevel * 100) + '%',
        batteryState: this.batteryState,
        powerMode: this.powerMode
      });

      return {
        success: true,
        batteryLevel: this.batteryLevel,
        powerMode: this.powerMode
      };
    } catch (error) {
      console.error('BatteryOptimizer: Initialization failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load saved settings
   */
  async loadSettings() {
    try {
      const savedSettings = await AsyncStorage.getItem(POWER_SETTINGS_KEY);
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('BatteryOptimizer: Failed to load settings', error);
    }
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      await AsyncStorage.setItem(POWER_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('BatteryOptimizer: Failed to save settings', error);
    }
  }

  /**
   * Start battery monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Set up battery level monitoring
    this.batteryCheckTimer = setInterval(() => {
      this.updateBatteryState();
    }, BATTERY_CHECK_INTERVAL);

    // Set up battery listeners
    Battery.addBatteryLevelListener(({ batteryLevel }) => {
      this.handleBatteryLevelChange(batteryLevel);
    });

    Battery.addBatteryStateListener(({ batteryState }) => {
      this.handleBatteryStateChange(batteryState);
    });

    // Set up thermal monitoring (simulated)
    if (this.settings.thermalThrottling) {
      this.thermalCheckTimer = setInterval(() => {
        this.checkThermalState();
      }, THERMAL_CHECK_INTERVAL);
    }

    // Set up app state listener for adaptive processing
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * Stop battery monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.batteryCheckTimer) {
      clearInterval(this.batteryCheckTimer);
      this.batteryCheckTimer = null;
    }

    if (this.thermalCheckTimer) {
      clearInterval(this.thermalCheckTimer);
      this.thermalCheckTimer = null;
    }
  }

  /**
   * Update battery state
   */
  async updateBatteryState() {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();

      const previousLevel = this.batteryLevel;
      this.batteryLevel = batteryLevel;
      this.batteryState = batteryState;

      // Calculate drain rate
      this.calculateDrainRate(previousLevel, batteryLevel);

      // Record battery history
      this.recordBatteryHistory();

      // Update power mode based on battery level
      if (this.settings.autoPowerMode) {
        this.updatePowerMode();
      }

      // Update optimization state
      this.updateOptimizationState();

      // Update processing intensity
      this.updateProcessingIntensity();

      return {
        level: batteryLevel,
        state: batteryState,
        powerMode: this.powerMode,
        processingIntensity: this.processingIntensity
      };
    } catch (error) {
      console.error('BatteryOptimizer: Failed to update battery state', error);
      return null;
    }
  }

  /**
   * Calculate battery drain rate
   */
  calculateDrainRate(previousLevel, currentLevel) {
    if (this.lastBatteryCheck && previousLevel && currentLevel < previousLevel) {
      const timeDiff = Date.now() - this.lastBatteryCheck;
      const levelDiff = previousLevel - currentLevel;

      // Calculate drain rate per hour
      this.drainRate = (levelDiff / timeDiff) * 3600000;

      // Smooth drain rate with moving average
      if (this.batteryHistory.length > 0) {
        const recentDrainRates = this.batteryHistory
          .slice(-5)
          .map(h => h.drainRate)
          .filter(r => r > 0);

        if (recentDrainRates.length > 0) {
          const avgDrainRate = recentDrainRates.reduce((a, b) => a + b, 0) / recentDrainRates.length;
          this.drainRate = (this.drainRate + avgDrainRate) / 2;
        }
      }

      // Check if drain rate exceeds target
      if (this.drainRate > this.settings.targetDrainRate) {
        this.handleExcessiveDrain();
      }
    }

    this.lastBatteryCheck = Date.now();
  }

  /**
   * Handle excessive battery drain
   */
  handleExcessiveDrain() {
    console.warn('BatteryOptimizer: Excessive battery drain detected', {
      drainRate: Math.round(this.drainRate * 100) + '%/hour',
      target: Math.round(this.settings.targetDrainRate * 100) + '%/hour'
    });

    // Switch to more aggressive power saving
    if (this.powerMode !== PowerMode.POWER_SAVER && this.powerMode !== PowerMode.ULTRA_POWER_SAVER) {
      this.setPowerMode(PowerMode.POWER_SAVER);
    }

    // Emit warning event
    this.emit('excessiveDrain', {
      drainRate: this.drainRate,
      currentMode: this.powerMode,
      recommendations: this.getOptimizationRecommendations()
    });
  }

  /**
   * Update power mode based on battery level
   */
  updatePowerMode() {
    const prevMode = this.powerMode;

    if (this.batteryState === Battery.BatteryState.CHARGING) {
      // Charging: use high performance if enabled
      if (this.settings.chargingBoost) {
        this.powerMode = PowerMode.HIGH_PERFORMANCE;
      } else {
        this.powerMode = PowerMode.BALANCED;
      }
    } else if (this.batteryLevel < CRITICAL_BATTERY_THRESHOLD) {
      // Critical battery: ultra power saver
      this.powerMode = PowerMode.ULTRA_POWER_SAVER;
    } else if (this.batteryLevel < LOW_BATTERY_THRESHOLD) {
      // Low battery: power saver
      this.powerMode = PowerMode.POWER_SAVER;
    } else if (this.batteryLevel > 0.5) {
      // Good battery: balanced or high performance
      this.powerMode = this.settings.aggressivePowerSaving
        ? PowerMode.BALANCED
        : PowerMode.HIGH_PERFORMANCE;
    } else {
      // Medium battery: balanced
      this.powerMode = PowerMode.BALANCED;
    }

    if (prevMode !== this.powerMode) {
      this.onPowerModeChanged(prevMode, this.powerMode);
    }
  }

  /**
   * Update optimization state
   */
  updateOptimizationState() {
    const prevState = this.optimizationState;

    if (this.batteryState === Battery.BatteryState.CHARGING) {
      this.optimizationState = BatteryOptimizationState.CHARGING_BOOST;
    } else if (this.batteryLevel < CRITICAL_BATTERY_THRESHOLD) {
      this.optimizationState = BatteryOptimizationState.CRITICAL;
    } else if (this.batteryLevel < LOW_BATTERY_THRESHOLD || this.drainRate > this.settings.targetDrainRate) {
      this.optimizationState = BatteryOptimizationState.CONSERVATIVE;
    } else {
      this.optimizationState = BatteryOptimizationState.OPTIMAL;
    }

    if (prevState !== this.optimizationState) {
      console.log(`BatteryOptimizer: State changed from ${prevState} to ${this.optimizationState}`);
    }
  }

  /**
   * Update processing intensity based on power mode and thermal state
   */
  updateProcessingIntensity() {
    let intensity = ProcessingIntensity.FULL;

    // Adjust based on power mode
    switch (this.powerMode) {
      case PowerMode.ULTRA_POWER_SAVER:
        intensity = ProcessingIntensity.MINIMAL;
        break;
      case PowerMode.POWER_SAVER:
        intensity = ProcessingIntensity.LOW;
        break;
      case PowerMode.BALANCED:
        intensity = ProcessingIntensity.MEDIUM;
        break;
      case PowerMode.HIGH_PERFORMANCE:
        intensity = ProcessingIntensity.FULL;
        break;
    }

    // Adjust based on thermal state
    switch (this.thermalState) {
      case ThermalState.CRITICAL:
        intensity = Math.min(intensity, ProcessingIntensity.MINIMAL);
        break;
      case ThermalState.HOT:
        intensity = Math.min(intensity, ProcessingIntensity.LOW);
        break;
      case ThermalState.WARM:
        intensity = Math.min(intensity, ProcessingIntensity.MEDIUM);
        break;
    }

    // Apply charging boost if applicable
    if (this.batteryState === Battery.BatteryState.CHARGING && this.settings.chargingBoost) {
      intensity = Math.min(ProcessingIntensity.FULL, intensity * 1.5);
    }

    this.processingIntensity = intensity;
  }

  /**
   * Check thermal state (simulated based on processing history)
   */
  checkThermalState() {
    // In production, this would use native APIs to get actual device temperature
    // For now, simulate based on recent processing intensity and time

    const performanceStats = performanceMonitor.getOptimizationStats?.() || {};
    const memoryStats = memoryManager.getMemoryStats?.() || {};

    // Estimate thermal state based on recent activity
    let thermalScore = 0;

    // Factor in processing intensity history
    if (this.processingIntensity >= ProcessingIntensity.HIGH) {
      thermalScore += 0.3;
    }

    // Factor in memory pressure
    if (memoryStats.current?.pressure === 'critical') {
      thermalScore += 0.2;
    }

    // Factor in continuous processing time
    const processingDuration = performanceStats.processingDuration || 0;
    if (processingDuration > 60000) { // More than 1 minute
      thermalScore += 0.2;
    }

    // Update thermal state based on score
    const prevState = this.thermalState;

    if (thermalScore >= 0.7) {
      this.thermalState = ThermalState.CRITICAL;
    } else if (thermalScore >= 0.5) {
      this.thermalState = ThermalState.HOT;
    } else if (thermalScore >= 0.3) {
      this.thermalState = ThermalState.WARM;
    } else {
      this.thermalState = ThermalState.NORMAL;
    }

    if (prevState !== this.thermalState) {
      this.handleThermalStateChange(prevState, this.thermalState);
    }
  }

  /**
   * Handle thermal state changes
   */
  handleThermalStateChange(oldState, newState) {
    console.log(`BatteryOptimizer: Thermal state changed from ${oldState} to ${newState}`);

    // Update processing intensity
    this.updateProcessingIntensity();

    // Emit thermal event
    this.emit('thermalStateChanged', {
      previous: oldState,
      current: newState,
      processingIntensity: this.processingIntensity
    });

    // Apply thermal throttling if needed
    if (newState === ThermalState.CRITICAL || newState === ThermalState.HOT) {
      this.applyThermalThrottling();
    }
  }

  /**
   * Apply thermal throttling
   */
  applyThermalThrottling() {
    console.log('BatteryOptimizer: Applying thermal throttling');

    // Reduce processing intensity
    this.processingIntensity = Math.min(
      this.processingIntensity,
      ProcessingIntensity.LOW
    );

    // Emit throttling event
    this.emit('thermalThrottling', {
      thermalState: this.thermalState,
      processingIntensity: this.processingIntensity
    });
  }

  /**
   * Handle battery level changes
   */
  handleBatteryLevelChange(batteryLevel) {
    const previousLevel = this.batteryLevel;
    this.batteryLevel = batteryLevel;

    // Calculate drain rate
    this.calculateDrainRate(previousLevel, batteryLevel);

    // Update power mode if needed
    if (this.settings.autoPowerMode) {
      this.updatePowerMode();
    }

    // Update optimization state
    this.updateOptimizationState();

    // Emit battery level change event
    this.emit('batteryLevelChanged', {
      previous: previousLevel,
      current: batteryLevel,
      drainRate: this.drainRate
    });
  }

  /**
   * Handle battery state changes
   */
  handleBatteryStateChange(batteryState) {
    const previousState = this.batteryState;
    this.batteryState = batteryState;

    console.log(`BatteryOptimizer: Battery state changed from ${previousState} to ${batteryState}`);

    // Update power mode
    if (this.settings.autoPowerMode) {
      this.updatePowerMode();
    }

    // Update optimization state
    this.updateOptimizationState();

    // Emit battery state change event
    this.emit('batteryStateChanged', {
      previous: previousState,
      current: batteryState
    });
  }

  /**
   * Handle power mode changes
   */
  onPowerModeChanged(oldMode, newMode) {
    console.log(`BatteryOptimizer: Power mode changed from ${oldMode} to ${newMode}`);

    // Update processing intensity
    this.updateProcessingIntensity();

    // Emit power mode change event
    this.emit('powerModeChanged', {
      previous: oldMode,
      current: newMode,
      processingIntensity: this.processingIntensity
    });
  }

  /**
   * Handle app state changes
   */
  handleAppStateChange(nextAppState) {
    // Reduce intensity when app is in background
    if (nextAppState === 'background') {
      this.processingIntensity = Math.min(
        this.processingIntensity,
        ProcessingIntensity.LOW
      );
    }
  }

  /**
   * Get optimization settings for processing
   */
  getOptimizationSettings() {
    const settings = {
      frameRate: 30,
      resolution: 'high',
      chunkSize: 10,
      parallelWorkers: 3,
      cacheEnabled: true,
      compressionQuality: 0.9
    };

    // Adjust settings based on processing intensity
    switch (this.processingIntensity) {
      case ProcessingIntensity.MINIMAL:
        settings.frameRate = 5;
        settings.resolution = 'low';
        settings.chunkSize = 3;
        settings.parallelWorkers = 1;
        settings.cacheEnabled = false;
        settings.compressionQuality = 0.5;
        break;
      case ProcessingIntensity.LOW:
        settings.frameRate = 10;
        settings.resolution = 'low';
        settings.chunkSize = 5;
        settings.parallelWorkers = 1;
        settings.compressionQuality = 0.6;
        break;
      case ProcessingIntensity.MEDIUM:
        settings.frameRate = 15;
        settings.resolution = 'medium';
        settings.chunkSize = 8;
        settings.parallelWorkers = 2;
        settings.compressionQuality = 0.7;
        break;
      case ProcessingIntensity.HIGH:
        settings.frameRate = 20;
        settings.resolution = 'medium';
        settings.chunkSize = 10;
        settings.parallelWorkers = 2;
        settings.compressionQuality = 0.8;
        break;
      case ProcessingIntensity.FULL:
        // Use default high settings
        break;
    }

    // Apply charging boost if applicable
    if (this.batteryState === Battery.BatteryState.CHARGING && this.settings.chargingBoost) {
      settings.frameRate = Math.min(30, settings.frameRate * 1.5);
      settings.parallelWorkers = Math.min(5, settings.parallelWorkers + 1);
    }

    return settings;
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];

    if (this.batteryLevel < LOW_BATTERY_THRESHOLD) {
      recommendations.push({
        type: 'battery',
        message: 'Consider plugging in your device for optimal performance',
        priority: 'high'
      });
    }

    if (this.drainRate > this.settings.targetDrainRate) {
      recommendations.push({
        type: 'drain',
        message: 'High battery drain detected. Processing intensity reduced.',
        priority: 'medium'
      });
    }

    if (this.thermalState === ThermalState.HOT || this.thermalState === ThermalState.CRITICAL) {
      recommendations.push({
        type: 'thermal',
        message: 'Device is warm. Consider taking a break to cool down.',
        priority: 'high'
      });
    }

    if (this.powerMode === PowerMode.ULTRA_POWER_SAVER) {
      recommendations.push({
        type: 'power',
        message: 'Ultra power saver mode active. Performance significantly reduced.',
        priority: 'high'
      });
    }

    // Add network-based recommendations
    NetInfo.fetch().then(state => {
      if (state.type !== 'wifi' && this.batteryLevel < 0.5) {
        recommendations.push({
          type: 'network',
          message: 'Consider using WiFi to reduce battery drain',
          priority: 'low'
        });
      }
    });

    return recommendations;
  }

  /**
   * Record battery history
   */
  recordBatteryHistory() {
    this.batteryHistory.push({
      level: this.batteryLevel,
      state: this.batteryState,
      powerMode: this.powerMode,
      drainRate: this.drainRate,
      processingIntensity: this.processingIntensity,
      thermalState: this.thermalState,
      timestamp: Date.now()
    });

    // Keep only last 100 entries
    if (this.batteryHistory.length > 100) {
      this.batteryHistory.shift();
    }
  }

  /**
   * Get battery statistics
   */
  getBatteryStats() {
    if (this.batteryHistory.length === 0) {
      return null;
    }

    const recent = this.batteryHistory.slice(-10);
    const avgDrainRate = recent.reduce((sum, h) => sum + (h.drainRate || 0), 0) / recent.length;
    const avgLevel = recent.reduce((sum, h) => sum + h.level, 0) / recent.length;

    // Estimate time remaining
    let estimatedMinutesRemaining = null;
    if (avgDrainRate > 0 && this.batteryState !== Battery.BatteryState.CHARGING) {
      estimatedMinutesRemaining = Math.round((this.batteryLevel / avgDrainRate) * 60);
    }

    return {
      current: {
        level: Math.round(this.batteryLevel * 100),
        state: this.batteryState,
        powerMode: this.powerMode,
        processingIntensity: this.processingIntensity,
        thermalState: this.thermalState,
        optimizationState: this.optimizationState
      },
      averageDrainRate: Math.round(avgDrainRate * 100),
      averageLevel: Math.round(avgLevel * 100),
      estimatedMinutesRemaining,
      recommendations: this.getOptimizationRecommendations()
    };
  }

  /**
   * Save battery statistics
   */
  async saveBatteryStats() {
    try {
      const stats = {
        history: this.batteryHistory.slice(-50), // Save last 50 entries
        lastSaved: Date.now()
      };

      await AsyncStorage.setItem(BATTERY_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('BatteryOptimizer: Failed to save battery stats', error);
    }
  }

  /**
   * Load battery statistics
   */
  async loadBatteryStats() {
    try {
      const data = await AsyncStorage.getItem(BATTERY_STATS_KEY);

      if (data) {
        const stats = JSON.parse(data);
        this.batteryHistory = stats.history || [];
      }
    } catch (error) {
      console.error('BatteryOptimizer: Failed to load battery stats', error);
    }
  }

  /**
   * Set power mode manually
   */
  setPowerMode(mode) {
    const validModes = Object.values(PowerMode);
    if (!validModes.includes(mode)) {
      console.error(`BatteryOptimizer: Invalid power mode ${mode}`);
      return;
    }

    const prevMode = this.powerMode;
    this.powerMode = mode;
    this.settings.autoPowerMode = false; // Disable auto mode when set manually

    this.updateProcessingIntensity();
    this.saveSettings();

    if (prevMode !== mode) {
      this.onPowerModeChanged(prevMode, mode);
    }
  }

  /**
   * Check if safe to process
   */
  canProcess() {
    // Don't process if battery is critically low
    if (this.batteryLevel < CRITICAL_BATTERY_THRESHOLD &&
        this.batteryState !== Battery.BatteryState.CHARGING) {
      return false;
    }

    // Don't process if thermal state is critical
    if (this.thermalState === ThermalState.CRITICAL) {
      return false;
    }

    return true;
  }

  /**
   * Get estimated battery usage for processing
   */
  estimateBatteryUsage(duration, intensity = null) {
    const processingIntensity = intensity || this.processingIntensity;

    // Estimate based on historical drain rate and intensity
    const baseDrainRate = this.drainRate > 0 ? this.drainRate : 0.05; // Default 5%/hour
    const intensityMultiplier = processingIntensity;

    // Calculate estimated drain for duration (in milliseconds)
    const estimatedDrain = (duration / 3600000) * baseDrainRate * intensityMultiplier;

    return {
      estimatedDrain: Math.round(estimatedDrain * 100) / 100,
      currentLevel: Math.round(this.batteryLevel * 100),
      resultingLevel: Math.round((this.batteryLevel - estimatedDrain) * 100)
    };
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`BatteryOptimizer: Error in event listener for ${event}`, error);
        }
      });
    }
  }

  /**
   * Shutdown battery optimizer
   */
  shutdown() {
    this.stopMonitoring();
    this.saveBatteryStats();
    this.listeners.clear();
    console.log('BatteryOptimizer: Shutdown complete');
  }
}

// Export singleton instance
export default new BatteryOptimizer();