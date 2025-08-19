import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, themedStyles } from '../contexts/ThemeContext';
import { GlassContainer } from './GlassmorphismComponents';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Tooltip Component
 * 
 * A reusable tooltip component that works across the platform.
 * Provides contextual information and guidance to users.
 * 
 * Features:
 * - Auto-positioning to stay within screen bounds
 * - Multiple placement options (top, bottom, left, right)
 * - Smooth animations with reduced motion support
 * - Theme awareness and glassmorphism design
 * - Production-ready error handling
 * - Accessibility support
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Trigger element
 * @param {string} props.content - Tooltip content text
 * @param {string} props.placement - Placement direction ('top', 'bottom', 'left', 'right', 'auto')
 * @param {boolean} props.visible - Controlled visibility
 * @param {Function} props.onVisibilityChange - Visibility change callback
 * @param {number} props.delay - Show delay in milliseconds
 * @param {number} props.hideDelay - Hide delay in milliseconds
 * @param {Object} props.style - Custom styles for tooltip container
 * @param {Object} props.textStyle - Custom styles for tooltip text
 * @param {string} props.variant - Tooltip variant ('default', 'info', 'warning', 'success', 'error')
 * @param {boolean} props.showArrow - Whether to show arrow pointer
 * @param {number} props.maxWidth - Maximum width of tooltip
 */
export default function Tooltip({
  children,
  content,
  placement = 'auto',
  visible: controlledVisible,
  onVisibilityChange,
  delay = 500,
  hideDelay = 200,
  style,
  textStyle,
  variant = 'default',
  showArrow = true,
  maxWidth = 250,
  disabled = false,
  testID,
}) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [finalPlacement, setFinalPlacement] = useState(placement);
  const [measureComplete, setMeasureComplete] = useState(false);
  
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const showTimeout = useRef(null);
  const hideTimeout = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  const theme = useTheme();
  const isControlled = controlledVisible !== undefined;
  const isVisible = isControlled ? controlledVisible : visible;

  // Production error handling
  const handleError = (error, context) => {
    console.error(`Tooltip error in ${context}:`, error);
    // Reset state on error to prevent stuck tooltips
    setVisible(false);
    setMeasureComplete(false);
    clearTimeouts();
  };

  const clearTimeouts = () => {
    if (showTimeout.current) {
      clearTimeout(showTimeout.current);
      showTimeout.current = null;
    }
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, []);

  // Calculate optimal placement and position
  const calculatePosition = (triggerLayout) => {
    try {
      const { x, y, width, height } = triggerLayout;
      const tooltipWidth = Math.min(maxWidth, screenWidth - 40);
      const tooltipHeight = 60; // Estimated height
      const arrowSize = showArrow ? 8 : 0;
      const padding = 12;

      let newX = 0;
      let newY = 0;
      let newPlacement = placement;

      // Auto placement logic
      if (placement === 'auto') {
        const spaceTop = y;
        const spaceBottom = screenHeight - (y + height);
        const spaceLeft = x;
        const spaceRight = screenWidth - (x + width);

        // Prefer top or bottom first
        if (spaceTop > tooltipHeight + arrowSize + padding) {
          newPlacement = 'top';
        } else if (spaceBottom > tooltipHeight + arrowSize + padding) {
          newPlacement = 'bottom';
        } else if (spaceRight > tooltipWidth + arrowSize + padding) {
          newPlacement = 'right';
        } else if (spaceLeft > tooltipWidth + arrowSize + padding) {
          newPlacement = 'left';
        } else {
          newPlacement = 'bottom'; // Fallback
        }
      }

      // Calculate position based on final placement
      switch (newPlacement) {
        case 'top':
          newX = x + width / 2 - tooltipWidth / 2;
          newY = y - tooltipHeight - arrowSize - 4;
          break;
        case 'bottom':
          newX = x + width / 2 - tooltipWidth / 2;
          newY = y + height + arrowSize + 4;
          break;
        case 'left':
          newX = x - tooltipWidth - arrowSize - 4;
          newY = y + height / 2 - tooltipHeight / 2;
          break;
        case 'right':
          newX = x + width + arrowSize + 4;
          newY = y + height / 2 - tooltipHeight / 2;
          break;
      }

      // Keep tooltip within screen bounds
      newX = Math.max(20, Math.min(newX, screenWidth - tooltipWidth - 20));
      newY = Math.max(20, Math.min(newY, screenHeight - tooltipHeight - 20));

      setPosition({ x: newX, y: newY });
      setFinalPlacement(newPlacement);
      setMeasureComplete(true);
    } catch (error) {
      handleError(error, 'calculatePosition');
    }
  };

  // Measure trigger element and calculate position
  const measureTrigger = () => {
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        calculatePosition({ x, y, width, height });
      });
    }
  };

  const showTooltip = () => {
    if (disabled) return;
    
    try {
      clearTimeouts();
      showTimeout.current = setTimeout(() => {
        if (!isControlled) {
          setVisible(true);
        }
        measureTrigger();
        onVisibilityChange?.(true);
        
        // Animate in
        if (!theme.reducedMotion) {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 300,
              friction: 20,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          fadeAnim.setValue(1);
          scaleAnim.setValue(1);
        }
      }, delay);
    } catch (error) {
      handleError(error, 'showTooltip');
    }
  };

  const hideTooltip = () => {
    try {
      clearTimeouts();
      hideTimeout.current = setTimeout(() => {
        // Animate out
        if (!theme.reducedMotion) {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (!isControlled) {
              setVisible(false);
            }
            setMeasureComplete(false);
            onVisibilityChange?.(false);
          });
        } else {
          fadeAnim.setValue(0);
          scaleAnim.setValue(0.8);
          if (!isControlled) {
            setVisible(false);
          }
          setMeasureComplete(false);
          onVisibilityChange?.(false);
        }
      }, hideDelay);
    } catch (error) {
      handleError(error, 'hideTooltip');
    }
  };

  // Theme-aware styles
  const styles = themedStyles(({ theme, isDarkMode, spacing, typography }) => {
    const variantColors = {
      default: {
        background: isDarkMode ? 'rgba(45, 45, 45, 0.95)' : 'rgba(0, 0, 0, 0.85)',
        text: '#FFFFFF',
        border: 'rgba(255, 255, 255, 0.1)',
      },
      info: {
        background: 'rgba(33, 150, 243, 0.9)',
        text: '#FFFFFF',
        border: 'rgba(33, 150, 243, 0.3)',
      },
      warning: {
        background: 'rgba(255, 152, 0, 0.9)',
        text: '#FFFFFF',
        border: 'rgba(255, 152, 0, 0.3)',
      },
      success: {
        background: 'rgba(76, 175, 80, 0.9)',
        text: '#FFFFFF',
        border: 'rgba(76, 175, 80, 0.3)',
      },
      error: {
        background: 'rgba(244, 67, 54, 0.9)',
        text: '#FFFFFF',
        border: 'rgba(244, 67, 54, 0.3)',
      },
    };

    const colors = variantColors[variant] || variantColors.default;

    return {
      modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
      },
      tooltipContainer: {
        position: 'absolute',
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: spacing?.sm || 12,
        paddingVertical: spacing?.xs || 8,
        maxWidth: maxWidth,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      tooltipText: {
        fontSize: typography?.fontSize?.sm || 14,
        color: colors.text,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: typography?.fontWeight?.medium || '500',
      },
      arrow: {
        position: 'absolute',
        width: 16,
        height: 16,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        transform: [{ rotate: '45deg' }],
      },
    };
  });

  const getArrowStyle = () => {
    const arrowStyle = { ...styles.arrow };
    const offset = -8; // Half of arrow size

    switch (finalPlacement) {
      case 'top':
        arrowStyle.bottom = offset;
        arrowStyle.left = '50%';
        arrowStyle.marginLeft = -8;
        break;
      case 'bottom':
        arrowStyle.top = offset;
        arrowStyle.left = '50%';
        arrowStyle.marginLeft = -8;
        break;
      case 'left':
        arrowStyle.right = offset;
        arrowStyle.top = '50%';
        arrowStyle.marginTop = -8;
        break;
      case 'right':
        arrowStyle.left = offset;
        arrowStyle.top = '50%';
        arrowStyle.marginTop = -8;
        break;
    }

    return arrowStyle;
  };

  const triggerElement = React.cloneElement(children, {
    ref: triggerRef,
    onPress: children.props.onPress, // Preserve original onPress
    onPressIn: () => {
      children.props.onPressIn?.();
      showTooltip();
    },
    onPressOut: () => {
      children.props.onPressOut?.();
      hideTooltip();
    },
    onLongPress: () => {
      children.props.onLongPress?.();
      showTooltip();
    },
    accessible: true,
    accessibilityLabel: children.props.accessibilityLabel || content,
    accessibilityHint: children.props.accessibilityHint || `Shows tooltip: ${content}`,
  });

  return (
    <>
      {triggerElement}
      
      <Modal
        visible={isVisible && measureComplete && !!content}
        transparent
        animationType="none"
        onRequestClose={hideTooltip}
        supportedOrientations={['portrait', 'landscape']}
        testID={testID}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={hideTooltip}
          accessible={false}
        >
          <Animated.View
            style={[
              styles.tooltipContainer,
              {
                left: position.x,
                top: position.y,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
              style,
            ]}
            accessible
            accessibilityRole="tooltip"
            accessibilityLabel={content}
          >
            {showArrow && <View style={getArrowStyle()} />}
            <Text style={[styles.tooltipText, textStyle]}>{content}</Text>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// Production-ready PropTypes for development validation
Tooltip.defaultProps = {
  placement: 'auto',
  delay: 500,
  hideDelay: 200,
  variant: 'default',
  showArrow: true,
  maxWidth: 250,
  disabled: false,
};