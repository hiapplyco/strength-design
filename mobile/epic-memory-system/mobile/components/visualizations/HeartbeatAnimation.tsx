import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { HeartbeatAnimationProps } from './VisualizationTypes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * ECG Waveform Point Component
 * Individual points that make up the ECG trace
 */
const ECGPoint = React.memo<{
  point: {
    id: string;
    x: number;
    y: number;
    intensity: number;
    isHeartbeat: boolean;
    color: string;
    delay: number;
  };
  lineHeight: number;
  baselineY: number;
}>(({ point, lineHeight, baselineY }) => {
  const drawAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Draw the point
    Animated.timing(drawAnim, {
      toValue: 1,
      duration: 50,
      delay: point.delay,
      useNativeDriver: true,
    }).start();

    // Special pulse for heartbeat points
    if (point.isHeartbeat) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => {
      drawAnim.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, [point.delay, point.isHeartbeat]);

  const pointHeight = point.isHeartbeat 
    ? lineHeight * point.intensity
    : lineHeight * (point.intensity * 0.3);

  const glowIntensity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [point.intensity, point.intensity * 2],
  });

  return (
    <Animated.View
      style={[
        styles.ecgPoint,
        {
          left: point.x,
          top: baselineY - pointHeight,
          width: 2,
          height: pointHeight,
          backgroundColor: point.color,
          opacity: drawAnim,
          shadowColor: point.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glowIntensity,
          shadowRadius: point.isHeartbeat ? 8 : 3,
          elevation: point.isHeartbeat ? 6 : 2,
        },
      ]}
    />
  );
});

/**
 * Heart Rate Line Component
 * Connects ECG points to form continuous waveform
 */
const HeartRateLine = React.memo<{
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  color: string;
  delay: number;
  intensity: number;
}>(({ startPoint, endPoint, color, delay, intensity }) => {
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(lineAnim, {
      toValue: 1,
      duration: 100,
      delay,
      useNativeDriver: true,
    }).start();

    return () => {
      lineAnim.stopAnimation();
    };
  }, [delay]);

  const distance = Math.sqrt(
    Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
  );
  const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);

  const scaleX = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.heartRateLine,
        {
          left: startPoint.x,
          top: startPoint.y - 1,
          width: distance,
          height: 2,
          backgroundColor: color,
          opacity: lineAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, intensity],
          }),
          transform: [
            { rotate: `${angle}rad` },
            { scaleX },
          ],
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 4,
        },
      ]}
    />
  );
});

/**
 * Heart Monitor Grid Component
 * ECG-style background grid
 */
const MonitorGrid = React.memo<{
  gridColor: string;
  cellSize: number;
}>(({ gridColor, cellSize }) => {
  const gridAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(gridAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    return () => {
      gridAnim.stopAnimation();
    };
  }, []);

  const verticalLines = Math.floor(SCREEN_WIDTH / cellSize);
  const horizontalLines = Math.floor(SCREEN_HEIGHT / cellSize);

  return (
    <Animated.View
      style={[
        styles.monitorGrid,
        {
          opacity: gridAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.3],
          }),
        },
      ]}
    >
      {/* Vertical lines */}
      {[...Array(verticalLines)].map((_, i) => (
        <View
          key={`v-${i}`}
          style={[
            styles.gridLine,
            {
              left: i * cellSize,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: gridColor,
              opacity: i % 5 === 0 ? 0.6 : 0.3,
            },
          ]}
        />
      ))}
      
      {/* Horizontal lines */}
      {[...Array(horizontalLines)].map((_, i) => (
        <View
          key={`h-${i}`}
          style={[
            styles.gridLine,
            {
              top: i * cellSize,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: gridColor,
              opacity: i % 5 === 0 ? 0.6 : 0.3,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
});

/**
 * Heart Rate Value Display
 * Shows current BPM reading
 */
const HeartRateDisplay = React.memo<{
  currentBPM: number;
  targetBPM: number;
  centerX: number;
  centerY: number;
  colors: string[];
}>(({ currentBPM, targetBPM, centerX, centerY, colors }) => {
  const bpmAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(bpmAnim, {
      toValue: currentBPM,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Pulse animation synced to heart rate
    const pulseDuration = 60000 / currentBPM; // ms per beat
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: pulseDuration * 0.2,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: pulseDuration * 0.8,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      bpmAnim.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, [currentBPM]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View
      style={[
        styles.bpmDisplay,
        {
          left: centerX - 60,
          top: centerY - 150,
          transform: [{ scale }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.bpmValue,
          {
            shadowColor: colors[0],
            shadowOpacity: glowOpacity,
            shadowRadius: 15,
          },
        ]}
      />
      
      <View style={styles.bpmLabel} />
    </Animated.View>
  );
});

/**
 * Vital Signs Indicators
 * Additional health metrics display
 */
const VitalSigns = React.memo<{
  heartRate: number;
  oxygenLevel: number;
  bloodPressure: { systolic: number; diastolic: number };
  colors: string[];
  centerX: number;
  centerY: number;
}>(({ heartRate, oxygenLevel, bloodPressure, colors, centerX, centerY }) => {
  const vitalsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(vitalsAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      vitalsAnim.stopAnimation();
    };
  }, []);

  const indicators = [
    { label: 'HR', value: heartRate, unit: 'BPM', color: colors[0] },
    { label: 'SpO₂', value: oxygenLevel, unit: '%', color: colors[1] },
    { label: 'BP', value: `${bloodPressure.systolic}/${bloodPressure.diastolic}`, unit: '', color: colors[2] },
  ];

  return (
    <View style={[
      styles.vitalSigns,
      {
        left: 20,
        top: centerY + 100,
      }
    ]}>
      {indicators.map((indicator, index) => (
        <Animated.View
          key={indicator.label}
          style={[
            styles.vitalIndicator,
            {
              opacity: vitalsAnim,
              transform: [
                {
                  translateY: vitalsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
              borderColor: indicator.color,
            },
          ]}
        >
          <View style={[styles.vitalValue, { backgroundColor: indicator.color }]} />
          <View style={styles.vitalLabel} />
        </Animated.View>
      ))}
    </View>
  );
});

/**
 * Main Heartbeat Animation Component
 * Creates realistic ECG monitor with heart rate tracking
 */
const HeartbeatAnimation: React.FC<HeartbeatAnimationProps> = ({
  duration = 4000,
  onComplete,
  colors = ['#FF6B35', '#00FF88', '#00F0FF', '#FFD700'],
  size = 300,
  isVisible = true,
  heartRate = 75,
  showVitals = true,
  monitorType = 'ECG',
  intensity = 'normal',
  style,
}) => {
  const [animationPhase, setAnimationPhase] = useState<'connecting' | 'monitoring' | 'analyzing' | 'completed'>('connecting');
  const [currentBPM, setCurrentBPM] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasCompleted = useRef(false);

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;
  const baselineY = centerY;
  const waveformWidth = SCREEN_WIDTH * 0.8;
  const waveformHeight = 120;

  // Generate ECG waveform data
  const ecgWaveform = useMemo(() => {
    if (!isVisible) return [];

    const points = [];
    const pointCount = 100;
    const beatInterval = (60 / heartRate) * pointCount / 4; // Points per heartbeat
    
    for (let i = 0; i < pointCount; i++) {
      const x = (i / pointCount) * waveformWidth + (SCREEN_WIDTH - waveformWidth) / 2;
      let y = 0;
      let isHeartbeat = false;
      let pointIntensity = 0.3;
      
      // Generate heartbeat pattern (simplified ECG)
      const beatPosition = i % beatInterval;
      const beatProgress = beatPosition / beatInterval;
      
      if (beatProgress < 0.05) {
        // P wave (atrial depolarization)
        y = Math.sin(beatProgress * Math.PI * 20) * 0.2;
        pointIntensity = 0.4;
      } else if (beatProgress >= 0.1 && beatProgress < 0.25) {
        // QRS complex (ventricular depolarization)
        const qrsProgress = (beatProgress - 0.1) / 0.15;
        if (qrsProgress < 0.3) {
          y = -qrsProgress * 0.3; // Q wave
        } else if (qrsProgress < 0.7) {
          y = (qrsProgress - 0.3) * 2.5 - 0.1; // R wave
          isHeartbeat = true;
          pointIntensity = 1;
        } else {
          y = (1 - qrsProgress) * 0.8 + 0.9; // S wave
          pointIntensity = 0.8;
        }
      } else if (beatProgress >= 0.4 && beatProgress < 0.65) {
        // T wave (ventricular repolarization)
        const tProgress = (beatProgress - 0.4) / 0.25;
        y = Math.sin(tProgress * Math.PI) * 0.4;
        pointIntensity = 0.5;
      } else {
        // Baseline with slight noise
        y = (Math.random() - 0.5) * 0.05;
        pointIntensity = 0.2;
      }
      
      points.push({
        id: `ecg-${i}`,
        x,
        y: baselineY + y * waveformHeight,
        intensity: pointIntensity,
        isHeartbeat,
        color: isHeartbeat ? colors[0] : colors[2],
        delay: i * 20,
      });
    }
    
    return points;
  }, [isVisible, heartRate, waveformWidth, waveformHeight, baselineY, colors]);

  // Generate connecting lines between points
  const ecgLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < ecgWaveform.length - 1; i++) {
      const currentPoint = ecgWaveform[i];
      const nextPoint = ecgWaveform[i + 1];
      
      lines.push({
        id: `line-${i}`,
        startPoint: { x: currentPoint.x, y: currentPoint.y },
        endPoint: { x: nextPoint.x, y: nextPoint.y },
        color: currentPoint.isHeartbeat || nextPoint.isHeartbeat ? colors[0] : colors[2],
        delay: currentPoint.delay + 10,
        intensity: Math.max(currentPoint.intensity, nextPoint.intensity),
      });
    }
    return lines;
  }, [ecgWaveform, colors]);

  useEffect(() => {
    if (!isVisible) return;

    // Animate BPM counter
    const bpmInterval = setInterval(() => {
      if (animationPhase === 'monitoring' || animationPhase === 'analyzing') {
        setCurrentBPM(prev => {
          const target = heartRate + (Math.random() - 0.5) * 4; // Slight variation
          return Math.min(prev + 2, target);
        });
      }
    }, 100);

    // Haptic feedback for heartbeat
    if (Platform.OS === 'ios' && (animationPhase === 'monitoring' || animationPhase === 'analyzing')) {
      const hapticInterval = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }, 60000 / heartRate); // Beat interval in ms

      setTimeout(() => clearInterval(hapticInterval), duration);
    }

    // Animation sequence
    const animationSequence = Animated.sequence([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Hold for monitoring
      Animated.delay(duration - 600),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        setAnimationPhase('completed');
        onComplete?.();
      }
    });

    // Phase transitions
    const phaseTimers = [
      setTimeout(() => setAnimationPhase('monitoring'), 500),
      setTimeout(() => setAnimationPhase('analyzing'), duration * 0.6),
    ];

    return () => {
      clearInterval(bpmInterval);
      fadeAnim.stopAnimation();
      phaseTimers.forEach(clearTimeout);
    };
  }, [isVisible, duration, animationPhase, heartRate, onComplete]);

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }, style]}>
      {/* Monitor background */}
      <View style={styles.monitorBackground}>
        <MonitorGrid gridColor={colors[3]} cellSize={20} />
      </View>

      {/* ECG waveform */}
      <View style={styles.waveformContainer}>
        {/* ECG points */}
        {ecgWaveform.map((point) => (
          <ECGPoint
            key={point.id}
            point={point}
            lineHeight={waveformHeight}
            baselineY={baselineY}
          />
        ))}
        
        {/* Connecting lines */}
        {ecgLines.map((line) => (
          <HeartRateLine
            key={line.id}
            startPoint={line.startPoint}
            endPoint={line.endPoint}
            color={line.color}
            delay={line.delay}
            intensity={line.intensity}
          />
        ))}
      </View>

      {/* Heart rate display */}
      <HeartRateDisplay
        currentBPM={currentBPM}
        targetBPM={heartRate}
        centerX={centerX}
        centerY={centerY}
        colors={colors}
      />

      {/* Vital signs */}
      {showVitals && (
        <VitalSigns
          heartRate={currentBPM}
          oxygenLevel={98}
          bloodPressure={{ systolic: 120, diastolic: 80 }}
          colors={colors}
          centerX={centerX}
          centerY={centerY}
        />
      )}

      {/* Monitor frame */}
      <View style={styles.monitorFrame}>
        <View style={[styles.frameEdge, { borderColor: colors[1] }]} />
      </View>

      {/* Status indicators */}
      {animationPhase === 'monitoring' && (
        <View style={styles.statusIndicators}>
          <Animated.View
            style={[
              styles.statusLight,
              {
                backgroundColor: colors[1],
                top: 50,
                right: 50,
              },
            ]}
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monitorBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0d1117',
  },
  monitorGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
  },
  waveformContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ecgPoint: {
    position: 'absolute',
    borderRadius: 1,
  },
  heartRateLine: {
    position: 'absolute',
    borderRadius: 1,
  },
  bpmDisplay: {
    position: 'absolute',
    width: 120,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  bpmValue: {
    width: 80,
    height: 40,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  bpmLabel: {
    width: 60,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 4,
  },
  vitalSigns: {
    position: 'absolute',
  },
  vitalIndicator: {
    width: 100,
    height: 40,
    marginBottom: 10,
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  vitalValue: {
    height: 16,
    borderRadius: 2,
    marginBottom: 4,
  },
  vitalLabel: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  monitorFrame: {
    position: 'absolute',
    top: 40,
    left: 40,
    right: 40,
    bottom: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  frameEdge: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  statusIndicators: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  statusLight: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default HeartbeatAnimation;