/**
 * Performance Dashboard Component
 * Real-time performance monitoring and analytics visualization
 *
 * Features:
 * - Live performance metrics display
 * - Battery and memory usage tracking
 * - Processing speed visualization
 * - Historical trend charts
 * - Alert and recommendation display
 * - Optimization controls
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Dimensions,
  Animated,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, ProgressChart } from 'react-native-chart-kit';

// Import performance services
import performanceMonitor from '../services/performanceMonitor';
import memoryManager from '../utils/memoryManager';
import batteryOptimizer from '../utils/batteryOptimizer';
import backgroundQueue from '../services/backgroundQueue';
import videoProcessor from '../services/videoProcessor';

const { width: screenWidth } = Dimensions.get('window');

// Chart configuration
const chartConfig = {
  backgroundGradientFrom: 'rgba(0, 0, 0, 0)',
  backgroundGradientTo: 'rgba(0, 0, 0, 0)',
  color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  propsForLabels: {
    fontSize: 10,
    fill: 'rgba(255, 255, 255, 0.7)'
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: 'rgba(255, 255, 255, 0.1)'
  }
};

const PerformanceDashboard = ({ onClose, isVisible = true }) => {
  // State for metrics
  const [metrics, setMetrics] = useState({
    processing: {
      fps: 0,
      framesProcessed: 0,
      totalFrames: 0,
      processingTime: 0,
      state: 'idle'
    },
    battery: {
      level: 100,
      drainRate: 0,
      powerMode: 'balanced',
      estimatedTime: null
    },
    memory: {
      used: 0,
      total: 0,
      percentage: 0,
      pressure: 'normal'
    },
    queue: {
      pending: 0,
      active: 0,
      completed: 0
    },
    alerts: []
  });

  const [chartData, setChartData] = useState({
    fps: [],
    memory: [],
    battery: []
  });

  const [settings, setSettings] = useState({
    autoOptimization: true,
    thermalThrottling: true,
    chargingBoost: true,
    debugMode: false
  });

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  const updateInterval = useRef(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Initialize monitoring
  useEffect(() => {
    if (isVisible) {
      startMonitoring();
      animateIn();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [isVisible]);

  // Animate dashboard entrance
  const animateIn = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  };

  // Start real-time monitoring
  const startMonitoring = () => {
    updateMetrics();

    // Set up update interval
    updateInterval.current = setInterval(() => {
      updateMetrics();
    }, 1000); // Update every second

    // Set up event listeners
    performanceMonitor.on('warning', handlePerformanceWarning);
    memoryManager.on('memoryPressureChanged', handleMemoryPressure);
    batteryOptimizer.on('excessiveDrain', handleBatteryWarning);
    backgroundQueue.on('jobProgress', handleQueueUpdate);
  };

  // Stop monitoring
  const stopMonitoring = () => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }

    // Remove event listeners
    performanceMonitor.off('warning', handlePerformanceWarning);
    memoryManager.off('memoryPressureChanged', handleMemoryPressure);
    batteryOptimizer.off('excessiveDrain', handleBatteryWarning);
    backgroundQueue.off('jobProgress', handleQueueUpdate);
  };

  // Update all metrics
  const updateMetrics = async () => {
    try {
      // Get performance metrics
      const processingStatus = videoProcessor.getStatus();
      const performanceStats = performanceMonitor.getOptimizationStats?.() || {};

      // Get battery stats
      const batteryStats = batteryOptimizer.getBatteryStats() || {};

      // Get memory stats
      const memoryStats = memoryManager.getMemoryStats() || {};

      // Get queue status
      const queueStatus = backgroundQueue.getQueueStatus();

      // Update state
      setMetrics(prev => ({
        ...prev,
        processing: {
          fps: performanceStats.averageFPS || 0,
          framesProcessed: processingStatus.progress?.current || 0,
          totalFrames: processingStatus.progress?.total || 0,
          processingTime: processingStatus.progress?.estimatedTimeRemaining || 0,
          state: processingStatus.state || 'idle'
        },
        battery: {
          level: batteryStats.current?.level || 100,
          drainRate: batteryStats.averageDrainRate || 0,
          powerMode: batteryStats.current?.powerMode || 'balanced',
          estimatedTime: batteryStats.estimatedMinutesRemaining
        },
        memory: {
          used: memoryStats.current?.used || 0,
          total: memoryStats.current?.total || 0,
          percentage: memoryStats.current?.percentage || 0,
          pressure: memoryStats.current?.pressure || 'normal'
        },
        queue: {
          pending: queueStatus.queueLength || 0,
          active: queueStatus.activeJobs || 0,
          completed: prev.queue.completed
        }
      }));

      // Update chart data
      updateChartData({
        fps: performanceStats.averageFPS || 0,
        memory: memoryStats.current?.percentage || 0,
        battery: batteryStats.current?.level || 100
      });
    } catch (error) {
      console.error('PerformanceDashboard: Failed to update metrics', error);
    }
  };

  // Update chart data with history
  const updateChartData = (newData) => {
    setChartData(prev => {
      const maxDataPoints = 20;

      return {
        fps: [...prev.fps.slice(-maxDataPoints + 1), newData.fps],
        memory: [...prev.memory.slice(-maxDataPoints + 1), newData.memory],
        battery: [...prev.battery.slice(-maxDataPoints + 1), newData.battery]
      };
    });
  };

  // Handle performance warnings
  const handlePerformanceWarning = (warning) => {
    addAlert({
      type: 'performance',
      message: `Performance: ${warning.type}`,
      severity: warning.severity
    });
  };

  // Handle memory pressure changes
  const handleMemoryPressure = (data) => {
    if (data.current === 'critical') {
      addAlert({
        type: 'memory',
        message: 'Critical memory pressure detected',
        severity: 'critical'
      });
    }
  };

  // Handle battery warnings
  const handleBatteryWarning = (data) => {
    addAlert({
      type: 'battery',
      message: `High battery drain: ${Math.round(data.drainRate * 100)}%/hour`,
      severity: 'warning'
    });
  };

  // Handle queue updates
  const handleQueueUpdate = (data) => {
    setMetrics(prev => ({
      ...prev,
      queue: {
        ...prev.queue,
        completed: prev.queue.completed + 1
      }
    }));
  };

  // Add alert
  const addAlert = (alert) => {
    setMetrics(prev => ({
      ...prev,
      alerts: [
        { ...alert, id: Date.now(), timestamp: Date.now() },
        ...prev.alerts.slice(0, 4) // Keep last 5 alerts
      ]
    }));
  };

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await updateMetrics();
    setRefreshing(false);
  }, []);

  // Toggle setting
  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    // Apply settings
    if (key === 'autoOptimization') {
      batteryOptimizer.settings.autoPowerMode = !settings[key];
    } else if (key === 'thermalThrottling') {
      batteryOptimizer.settings.thermalThrottling = !settings[key];
    } else if (key === 'chargingBoost') {
      batteryOptimizer.settings.chargingBoost = !settings[key];
    }
  };

  // Render metric card
  const renderMetricCard = (title, value, unit, icon, color, percentage = null) => (
    <BlurView intensity={20} style={styles.metricCard}>
      <LinearGradient
        colors={[`${color}20`, `${color}10`]}
        style={styles.metricGradient}
      >
        <View style={styles.metricHeader}>
          <Ionicons name={icon} size={20} color={color} />
          <Text style={styles.metricTitle}>{title}</Text>
        </View>
        <View style={styles.metricContent}>
          <Text style={[styles.metricValue, { color }]}>
            {value}
            <Text style={styles.metricUnit}>{unit}</Text>
          </Text>
          {percentage !== null && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${percentage}%`,
                    backgroundColor: color
                  }
                ]}
              />
            </View>
          )}
        </View>
      </LinearGradient>
    </BlurView>
  );

  // Render alert item
  const renderAlert = (alert) => {
    const colors = {
      critical: '#FF4444',
      warning: '#FFA500',
      info: '#4A90E2'
    };

    const icons = {
      performance: 'speedometer',
      memory: 'hardware-chip',
      battery: 'battery-dead'
    };

    return (
      <View key={alert.id} style={[styles.alertItem, { borderLeftColor: colors[alert.severity] }]}>
        <Ionicons
          name={icons[alert.type] || 'alert-circle'}
          size={16}
          color={colors[alert.severity]}
        />
        <Text style={styles.alertText}>{alert.message}</Text>
      </View>
    );
  };

  // Render chart
  const renderChart = () => {
    if (chartData.fps.length < 2) {
      return (
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>Collecting data...</Text>
        </View>
      );
    }

    const data = {
      labels: chartData.fps.map((_, i) => ''),
      datasets: [
        {
          data: chartData.fps,
          color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };

    return (
      <LineChart
        data={data}
        width={screenWidth - 40}
        height={180}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLabels={false}
        withHorizontalLabels={true}
        withDots={false}
      />
    );
  };

  // Render settings
  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Optimization Settings</Text>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Auto Optimization</Text>
          <Text style={styles.settingDescription}>
            Automatically adjust settings based on device state
          </Text>
        </View>
        <Switch
          value={settings.autoOptimization}
          onValueChange={() => toggleSetting('autoOptimization')}
          trackColor={{ false: '#767577', true: '#FFA500' }}
          thumbColor={settings.autoOptimization ? '#FF8C00' : '#f4f3f4'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Thermal Throttling</Text>
          <Text style={styles.settingDescription}>
            Reduce intensity when device is warm
          </Text>
        </View>
        <Switch
          value={settings.thermalThrottling}
          onValueChange={() => toggleSetting('thermalThrottling')}
          trackColor={{ false: '#767577', true: '#FFA500' }}
          thumbColor={settings.thermalThrottling ? '#FF8C00' : '#f4f3f4'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Charging Boost</Text>
          <Text style={styles.settingDescription}>
            Increase performance when charging
          </Text>
        </View>
        <Switch
          value={settings.chargingBoost}
          onValueChange={() => toggleSetting('chargingBoost')}
          trackColor={{ false: '#767577', true: '#FFA500' }}
          thumbColor={settings.chargingBoost ? '#FF8C00' : '#f4f3f4'}
        />
      </View>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }
          ]
        }
      ]}
    >
      <BlurView intensity={90} style={styles.header}>
        <Text style={styles.title}>Performance Monitor</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </BlurView>

      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setSelectedTab('overview')}
          style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedTab('charts')}
          style={[styles.tab, selectedTab === 'charts' && styles.tabActive]}
        >
          <Text style={[styles.tabText, selectedTab === 'charts' && styles.tabTextActive]}>
            Charts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedTab('settings')}
          style={[styles.tab, selectedTab === 'settings' && styles.tabActive]}
        >
          <Text style={[styles.tabText, selectedTab === 'settings' && styles.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFA500"
          />
        }
      >
        {selectedTab === 'overview' && (
          <>
            <View style={styles.metricsGrid}>
              {renderMetricCard(
                'FPS',
                metrics.processing.fps.toFixed(1),
                'fps',
                'speedometer',
                '#4A90E2',
                (metrics.processing.fps / 30) * 100
              )}
              {renderMetricCard(
                'Battery',
                metrics.battery.level,
                '%',
                'battery-charging',
                '#00C853',
                metrics.battery.level
              )}
              {renderMetricCard(
                'Memory',
                metrics.memory.percentage.toFixed(0),
                '%',
                'hardware-chip',
                '#FF6B6B',
                metrics.memory.percentage
              )}
              {renderMetricCard(
                'Queue',
                metrics.queue.active,
                ' active',
                'list',
                '#FFA500',
                (metrics.queue.active / 5) * 100
              )}
            </View>

            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Processing Status</Text>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>
                  State: <Text style={styles.statusValue}>{metrics.processing.state}</Text>
                </Text>
                <Text style={styles.statusLabel}>
                  Progress: <Text style={styles.statusValue}>
                    {metrics.processing.framesProcessed}/{metrics.processing.totalFrames}
                  </Text>
                </Text>
                {metrics.processing.processingTime > 0 && (
                  <Text style={styles.statusLabel}>
                    Est. Time: <Text style={styles.statusValue}>
                      {Math.round(metrics.processing.processingTime / 1000)}s
                    </Text>
                  </Text>
                )}
              </View>
            </View>

            {metrics.alerts.length > 0 && (
              <View style={styles.alertsSection}>
                <Text style={styles.sectionTitle}>Recent Alerts</Text>
                {metrics.alerts.map(renderAlert)}
              </View>
            )}
          </>
        )}

        {selectedTab === 'charts' && (
          <View style={styles.chartsContainer}>
            <Text style={styles.chartTitle}>Performance Trend (FPS)</Text>
            {renderChart()}

            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FFA500' }]} />
                <Text style={styles.legendText}>FPS</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.legendValue}>
                  Avg: {(chartData.fps.reduce((a, b) => a + b, 0) / chartData.fps.length).toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'settings' && renderSettings()}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFA500'
  },
  closeButton: {
    padding: 5
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  tab: {
    marginRight: 20,
    paddingVertical: 5
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFA500'
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14
  },
  tabTextActive: {
    color: '#FFA500',
    fontWeight: '600'
  },
  content: {
    flex: 1,
    padding: 20
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  metricCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden'
  },
  metricGradient: {
    padding: 15
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  metricTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginLeft: 8
  },
  metricContent: {
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    opacity: 0.7
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    borderRadius: 2
  },
  statusSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFA500',
    marginBottom: 10
  },
  statusInfo: {
    gap: 5
  },
  statusLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14
  },
  statusValue: {
    color: '#FFF',
    fontWeight: '500'
  },
  alertsSection: {
    marginBottom: 20
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 8,
    gap: 10
  },
  alertText: {
    color: '#FFF',
    fontSize: 13,
    flex: 1
  },
  chartsContainer: {
    marginBottom: 20
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFA500',
    marginBottom: 15
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  chartPlaceholder: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12
  },
  chartPlaceholderText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 20
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12
  },
  legendValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500'
  },
  settingsContainer: {
    marginBottom: 20
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFA500',
    marginBottom: 15
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 10
  },
  settingInfo: {
    flex: 1,
    marginRight: 15
  },
  settingLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4
  },
  settingDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12
  }
});

export default PerformanceDashboard;