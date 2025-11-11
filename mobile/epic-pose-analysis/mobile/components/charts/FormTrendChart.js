/**
 * Form Trend Chart Component
 * Interactive time-series visualization for form score improvements over time
 * 
 * Features:
 * - Line chart with smooth curves and data point markers
 * - Interactive touch gestures for data exploration
 * - Multiple exercise overlay support
 * - Trend analysis with moving averages
 * - Performance confidence indicators
 * - Zoom and pan interactions for detailed analysis
 * - Accessibility-compliant with screen reader support
 * - Mobile-optimized touch targets and responsive design
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Line,
  Circle,
  Path,
  LinearGradient,
  Stop,
  Defs,
  Text as SvgText,
  G,
  Rect,
} from 'react-native-svg';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GlassContainer } from '../GlassmorphismComponents';
import { createThemedStyles } from '../../utils/designTokens';

const { width: screenWidth } = Dimensions.get('window');

// Chart configuration
const CHART_CONFIG = {
  padding: { top: 20, right: 20, bottom: 60, left: 20 },
  gridLines: 5,
  pointRadius: 4,
  activePointRadius: 6,
  lineWidth: 2.5,
  confidenceLineWidth: 1.5,
  animationDuration: 800,
};

// Color schemes for different exercise types
const EXERCISE_COLORS = {
  squat: '#3B82F6',
  deadlift: '#EF4444',
  push_up: '#10B981',
  baseball_pitch: '#8B5CF6',
  default: '#FF6B35',
};

const FormTrendChart = ({
  data,
  exerciseType = 'squat',
  timePeriod = '30d',
  showConfidence = true,
  showMovingAverage = true,
  interactive = true,
  height = 300,
  theme,
  onDataPointPress,
  onRangeSelect,
  style,
  accessibilityLabel,
}) => {
  const styles = createThemedStyles(getStyles, theme?.isDark ? 'dark' : 'light');
  
  // State management
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Gesture handling
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const scale = useSharedValue(1);
  const tooltipOpacity = useSharedValue(0);
  
  // Chart dimensions
  const chartWidth = screenWidth - 40;
  const chartHeight = height;
  const plotWidth = chartWidth - CHART_CONFIG.padding.left - CHART_CONFIG.padding.right;
  const plotHeight = chartHeight - CHART_CONFIG.padding.top - CHART_CONFIG.padding.bottom;

  // Process chart data
  const processedData = useMemo(() => {
    if (!data || (typeof data === 'object' && !data.data)) {
      return { points: [], trends: [], confidence: [], stats: {} };
    }

    // Handle different data structures
    let chartData = [];
    let exerciseName = '';
    
    if (typeof data === 'object' && data.data) {
      // Single exercise data
      chartData = data.data || [];
      exerciseName = data.exerciseType || exerciseType;
    } else if (typeof data === 'object') {
      // Multiple exercises data
      if (exerciseType === 'all') {
        // Combine all exercises
        chartData = Object.values(data)
          .filter(exerciseData => exerciseData && exerciseData.data)
          .flatMap(exerciseData => 
            exerciseData.data.map(point => ({
              ...point,
              exerciseType: exerciseData.exerciseType,
            }))
          )
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        exerciseName = 'All Exercises';
      } else if (data[exerciseType]) {
        chartData = data[exerciseType].data || [];
        exerciseName = data[exerciseType].exerciseType || exerciseType;
      }
    }

    if (!chartData.length) {
      return { points: [], trends: [], confidence: [], stats: {} };
    }

    // Calculate chart bounds
    const scores = chartData.map(point => point.overallScore || 0);
    const confidenceValues = chartData.map(point => point.confidence || 0);
    const dates = chartData.map(point => new Date(point.date));
    
    const minScore = Math.max(0, Math.min(...scores) - 5);
    const maxScore = Math.min(100, Math.max(...scores) + 5);
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    // Generate chart points
    const points = chartData.map((dataPoint, index) => {
      const x = CHART_CONFIG.padding.left + 
        ((new Date(dataPoint.date) - minDate) / (maxDate - minDate)) * plotWidth;
      const y = CHART_CONFIG.padding.top + 
        (1 - (dataPoint.overallScore - minScore) / (maxScore - minScore)) * plotHeight;
      
      return {
        x,
        y,
        originalData: dataPoint,
        index,
        score: dataPoint.overallScore || 0,
        confidence: dataPoint.confidence || 0,
        date: dataPoint.date,
        exerciseType: dataPoint.exerciseType || exerciseType,
      };
    });

    // Calculate moving average if enabled
    const trends = showMovingAverage ? calculateMovingAverage(points, 3) : [];
    
    // Calculate confidence overlay
    const confidence = showConfidence ? 
      calculateConfidenceArea(points, minScore, maxScore) : [];

    // Calculate statistics
    const stats = {
      minScore,
      maxScore,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      totalPoints: points.length,
      improvement: scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0,
      exerciseName,
    };

    return { points, trends, confidence, stats };
  }, [data, exerciseType, showMovingAverage, showConfidence, height]);

  /**
   * Calculate moving average for trend line
   */
  const calculateMovingAverage = (points, window) => {
    const trends = [];
    
    for (let i = window - 1; i < points.length; i++) {
      const windowPoints = points.slice(i - window + 1, i + 1);
      const avgScore = windowPoints.reduce((sum, point) => sum + point.score, 0) / window;
      
      const y = CHART_CONFIG.padding.top + 
        (1 - (avgScore - processedData.stats.minScore) / 
        (processedData.stats.maxScore - processedData.stats.minScore)) * plotHeight;
      
      trends.push({
        x: points[i].x,
        y,
        avgScore,
      });
    }
    
    return trends;
  };

  /**
   * Calculate confidence area overlay
   */
  const calculateConfidenceArea = (points, minScore, maxScore) => {
    return points.map(point => {
      const confidenceBand = (point.confidence / 100) * 10; // Convert to score range
      const upperY = CHART_CONFIG.padding.top + 
        (1 - Math.min(point.score + confidenceBand, maxScore - minScore) / (maxScore - minScore)) * plotHeight;
      const lowerY = CHART_CONFIG.padding.top + 
        (1 - Math.max(point.score - confidenceBand, 0) / (maxScore - minScore)) * plotHeight;
      
      return {
        x: point.x,
        upperY,
        lowerY,
        confidence: point.confidence,
      };
    });
  };

  /**
   * Generate SVG path for smooth curve
   */
  const generateSmoothPath = (points) => {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currPoint = points[i];
      
      // Calculate control points for smooth curve
      const controlX = (prevPoint.x + currPoint.x) / 2;
      
      path += ` Q ${controlX} ${prevPoint.y} ${currPoint.x} ${currPoint.y}`;
    }
    
    return path;
  };

  /**
   * Generate confidence area path
   */
  const generateConfidencePath = (confidenceData) => {
    if (!confidenceData.length) return '';

    let upperPath = `M ${confidenceData[0].x} ${confidenceData[0].upperY}`;
    let lowerPath = `M ${confidenceData[0].x} ${confidenceData[0].lowerY}`;
    
    confidenceData.forEach((point, index) => {
      if (index > 0) {
        upperPath += ` L ${point.x} ${point.upperY}`;
        lowerPath += ` L ${point.x} ${point.lowerY}`;
      }
    });
    
    // Close the path
    const reversedLower = [...confidenceData].reverse();
    reversedLower.forEach(point => {
      upperPath += ` L ${point.x} ${point.lowerY}`;
    });
    upperPath += ' Z';
    
    return upperPath;
  };

  /**
   * Handle tap gesture on chart
   */
  const handleChartTap = (event) => {
    if (!interactive || !processedData.points.length) return;

    const { x: tapX, y: tapY } = event.nativeEvent;
    
    // Find closest point
    let closestPoint = null;
    let minDistance = Infinity;
    
    processedData.points.forEach(point => {
      const distance = Math.sqrt(
        Math.pow(tapX - point.x, 2) + Math.pow(tapY - point.y, 2)
      );
      
      if (distance < minDistance && distance < 40) { // 40px touch tolerance
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    if (closestPoint) {
      setSelectedPoint(closestPoint);
      setShowTooltip(true);
      tooltipOpacity.value = withTiming(1, { duration: 200 });
      
      if (onDataPointPress) {
        onDataPointPress(closestPoint.originalData);
      }
    } else {
      setShowTooltip(false);
      tooltipOpacity.value = withTiming(0, { duration: 200 });
    }
  };

  /**
   * Handle pan gesture for chart navigation
   */
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = panX.value;
    },
    onActive: (event, context) => {
      if (interactive) {
        panX.value = context.startX + event.translationX;
      }
    },
    onEnd: () => {
      // Add boundary constraints
      if (panX.value > 50) {
        panX.value = withTiming(50);
      } else if (panX.value < -50) {
        panX.value = withTiming(-50);
      }
    },
  });

  /**
   * Format date for display
   */
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  /**
   * Get exercise color
   */
  const getExerciseColor = (type) => {
    return EXERCISE_COLORS[type] || EXERCISE_COLORS.default;
  };

  /**
   * Render chart axes and grid
   */
  const renderAxesAndGrid = () => {
    const { stats } = processedData;
    const yLabels = [];
    
    // Generate Y-axis labels
    for (let i = 0; i <= CHART_CONFIG.gridLines; i++) {
      const value = stats.minScore + 
        (i / CHART_CONFIG.gridLines) * (stats.maxScore - stats.minScore);
      const y = CHART_CONFIG.padding.top + 
        (1 - i / CHART_CONFIG.gridLines) * plotHeight;
      
      yLabels.push(
        <G key={`y-label-${i}`}>
          <Line
            x1={CHART_CONFIG.padding.left}
            y1={y}
            x2={chartWidth - CHART_CONFIG.padding.right}
            y2={y}
            stroke={theme?.border?.light || 'rgba(0,0,0,0.1)'}
            strokeWidth={0.5}
            strokeDasharray="2,2"
          />
          <SvgText
            x={CHART_CONFIG.padding.left - 8}
            y={y + 4}
            fontSize="10"
            fill={theme?.text?.tertiary || '#6C757D'}
            textAnchor="end"
          >
            {Math.round(value)}
          </SvgText>
        </G>
      );
    }

    return yLabels;
  };

  /**
   * Render data points
   */
  const renderDataPoints = () => {
    return processedData.points.map((point, index) => {
      const isSelected = selectedPoint?.index === index;
      const exerciseColor = getExerciseColor(point.exerciseType);
      
      return (
        <G key={`point-${index}`}>
          <Circle
            cx={point.x}
            cy={point.y}
            r={isSelected ? CHART_CONFIG.activePointRadius : CHART_CONFIG.pointRadius}
            fill={exerciseColor}
            stroke="#FFFFFF"
            strokeWidth={isSelected ? 2 : 1}
            opacity={isSelected ? 1 : 0.8}
          />
          {isSelected && (
            <Circle
              cx={point.x}
              cy={point.y}
              r={CHART_CONFIG.activePointRadius + 4}
              fill="none"
              stroke={exerciseColor}
              strokeWidth={1}
              opacity={0.3}
            />
          )}
        </G>
      );
    });
  };

  /**
   * Render trend line
   */
  const renderTrendLine = () => {
    if (!processedData.trends.length) return null;
    
    const path = generateSmoothPath(processedData.trends);
    
    return (
      <Path
        d={path}
        stroke={theme?.text?.tertiary || '#6C757D'}
        strokeWidth={CHART_CONFIG.confidenceLineWidth}
        strokeDasharray="4,4"
        fill="none"
        opacity={0.6}
      />
    );
  };

  /**
   * Render main chart line
   */
  const renderMainLine = () => {
    if (!processedData.points.length) return null;
    
    const path = generateSmoothPath(processedData.points);
    const exerciseColor = getExerciseColor(exerciseType);
    
    return (
      <G>
        <Defs>
          <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={exerciseColor} stopOpacity="0.8" />
            <Stop offset="50%" stopColor={exerciseColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={exerciseColor} stopOpacity="0.8" />
          </LinearGradient>
        </Defs>
        <Path
          d={path}
          stroke="url(#lineGradient)"
          strokeWidth={CHART_CONFIG.lineWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    );
  };

  /**
   * Render confidence area
   */
  const renderConfidenceArea = () => {
    if (!processedData.confidence.length) return null;
    
    const path = generateConfidencePath(processedData.confidence);
    const exerciseColor = getExerciseColor(exerciseType);
    
    return (
      <Path
        d={path}
        fill={exerciseColor}
        opacity={0.1}
      />
    );
  };

  /**
   * Render tooltip
   */
  const renderTooltip = () => {
    if (!showTooltip || !selectedPoint) return null;

    const tooltipX = selectedPoint.x;
    const tooltipY = selectedPoint.y - 60;
    
    return (
      <Animated.View
        style={[
          styles.tooltip,
          {
            position: 'absolute',
            left: tooltipX - 60,
            top: tooltipY,
            opacity: tooltipOpacity,
          }
        ]}
      >
        <GlassContainer variant="default" style={styles.tooltipContainer}>
          <Text style={[styles.tooltipScore, { color: theme?.text?.primary }]}>
            {Math.round(selectedPoint.score)}%
          </Text>
          <Text style={[styles.tooltipDate, { color: theme?.text?.secondary }]}>
            {formatDate(selectedPoint.date)}
          </Text>
          {selectedPoint.confidence > 0 && (
            <Text style={[styles.tooltipConfidence, { color: theme?.text?.tertiary }]}>
              {Math.round(selectedPoint.confidence * 100)}% confident
            </Text>
          )}
        </GlassContainer>
      </Animated.View>
    );
  };

  // Show empty state if no data
  if (!processedData.points.length) {
    return (
      <View style={[styles.container, style]}>
        <GlassContainer variant="default" style={styles.emptyContainer}>
          <Ionicons
            name="analytics-outline"
            size={32}
            color={theme?.text?.tertiary || '#6C757D'}
          />
          <Text style={[styles.emptyTitle, { color: theme?.text?.primary }]}>
            No Data Available
          </Text>
          <Text style={[styles.emptyDescription, { color: theme?.text?.secondary }]}>
            Complete some pose analyses to see your progress trends
          </Text>
        </GlassContainer>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel || `Form trend chart for ${processedData.stats.exerciseName}`}
      accessibilityRole="image"
    >
      <GlassContainer variant="default" style={styles.chartContainer}>
        {/* Chart Header */}
        <View style={styles.chartHeader}>
          <View style={styles.headerLeft}>
            <Text style={[styles.chartTitle, { color: theme?.text?.primary }]}>
              Form Score Trend
            </Text>
            <Text style={[styles.chartSubtitle, { color: theme?.text?.secondary }]}>
              {processedData.stats.exerciseName} • {processedData.stats.totalPoints} sessions
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.improvementBadge}>
              <Ionicons
                name={processedData.stats.improvement >= 0 ? "trending-up" : "trending-down"}
                size={12}
                color={processedData.stats.improvement >= 0 ? "#10B981" : "#EF4444"}
              />
              <Text
                style={[
                  styles.improvementText,
                  { 
                    color: processedData.stats.improvement >= 0 ? "#10B981" : "#EF4444" 
                  }
                ]}
              >
                {processedData.stats.improvement >= 0 ? '+' : ''}
                {Math.round(processedData.stats.improvement)}
              </Text>
            </View>
          </View>
        </View>

        {/* Interactive Chart */}
        <PanGestureHandler onGestureEvent={panGestureHandler} enabled={interactive}>
          <Animated.View>
            <TapGestureHandler onHandlerStateChange={handleChartTap}>
              <View style={styles.chartArea}>
                <Svg width={chartWidth} height={chartHeight}>
                  {/* Axes and Grid */}
                  {renderAxesAndGrid()}
                  
                  {/* Confidence Area */}
                  {renderConfidenceArea()}
                  
                  {/* Trend Line */}
                  {renderTrendLine()}
                  
                  {/* Main Data Line */}
                  {renderMainLine()}
                  
                  {/* Data Points */}
                  {renderDataPoints()}
                </Svg>
                
                {/* Tooltip Overlay */}
                {renderTooltip()}
              </View>
            </TapGestureHandler>
          </Animated.View>
        </PanGestureHandler>

        {/* Chart Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View 
              style={[
                styles.legendColor, 
                { backgroundColor: getExerciseColor(exerciseType) }
              ]} 
            />
            <Text style={[styles.legendText, { color: theme?.text?.secondary }]}>
              Form Score
            </Text>
          </View>
          
          {showMovingAverage && (
            <View style={styles.legendItem}>
              <View 
                style={[
                  styles.legendLine, 
                  { backgroundColor: theme?.text?.tertiary || '#6C757D' }
                ]} 
              />
              <Text style={[styles.legendText, { color: theme?.text?.secondary }]}>
                Moving Average
              </Text>
            </View>
          )}
          
          {showConfidence && (
            <View style={styles.legendItem}>
              <View 
                style={[
                  styles.legendArea, 
                  { backgroundColor: getExerciseColor(exerciseType) + '30' }
                ]} 
              />
              <Text style={[styles.legendText, { color: theme?.text?.secondary }]}>
                Confidence Band
              </Text>
            </View>
          )}
        </View>
      </GlassContainer>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[8],
    minHeight: 200,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  chartContainer: {
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[6],
  },
  headerLeft: {
    flex: 1,
  },
  chartTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[1],
  },
  chartSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.background?.elevated || 'rgba(255,255,255,0.1)',
  },
  improvementText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing[1],
  },
  chartArea: {
    position: 'relative',
    marginBottom: theme.spacing[4],
  },
  tooltip: {
    zIndex: 1000,
  },
  tooltipContainer: {
    padding: theme.spacing[3],
    minWidth: 120,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  tooltipScore: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[1],
  },
  tooltipDate: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing[1],
  },
  tooltipConfidence: {
    fontSize: theme.typography.fontSize.xs,
    fontStyle: 'italic',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.border?.light || 'rgba(0,0,0,0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing[2],
  },
  legendLine: {
    width: 16,
    height: 2,
    marginRight: theme.spacing[2],
    opacity: 0.6,
  },
  legendArea: {
    width: 12,
    height: 12,
    marginRight: theme.spacing[2],
    borderRadius: 2,
  },
  legendText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

FormTrendChart.displayName = 'FormTrendChart';

export default FormTrendChart;