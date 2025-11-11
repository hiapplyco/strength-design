/**
 * Accessibility Validator for Pose Analysis Components
 * Validates WCAG 2.1 AA compliance for form score display components
 * 
 * Features:
 * - Color contrast ratio validation (4.5:1 minimum)
 * - Touch target size verification (44pt minimum)
 * - Text size and readability checks
 * - Screen reader compatibility validation
 * - Reduced motion support verification
 */

import { Platform, AccessibilityInfo, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// WCAG 2.1 AA Standards
const WCAG_STANDARDS = {
  MIN_CONTRAST_RATIO: 4.5,
  MIN_LARGE_TEXT_CONTRAST_RATIO: 3.0,
  MIN_TOUCH_TARGET_SIZE: 44,
  LARGE_TEXT_THRESHOLD: 18, // 18pt or 24px
  MIN_TEXT_SIZE: 12,
  MAX_LINE_LENGTH: 80, // characters
  MIN_COLOR_DIFFERENCE: 500,
};

// Accessibility Issues Severity
const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance according to WCAG formula
 */
function getRelativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1, color2) {
  const rgb1 = typeof color1 === 'string' ? hexToRgb(color1) : color1;
  const rgb2 = typeof color2 === 'string' ? hexToRgb(color2) : color2;
  
  if (!rgb1 || !rgb2) return 1;
  
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate color contrast compliance
 */
function validateColorContrast(foregroundColor, backgroundColor, isLargeText = false) {
  const contrastRatio = getContrastRatio(foregroundColor, backgroundColor);
  const requiredRatio = isLargeText 
    ? WCAG_STANDARDS.MIN_LARGE_TEXT_CONTRAST_RATIO 
    : WCAG_STANDARDS.MIN_CONTRAST_RATIO;
  
  return {
    passes: contrastRatio >= requiredRatio,
    ratio: contrastRatio,
    required: requiredRatio,
    level: contrastRatio >= 7.0 ? 'AAA' : contrastRatio >= requiredRatio ? 'AA' : 'FAIL',
  };
}

/**
 * Validate touch target size
 */
function validateTouchTargetSize(width, height) {
  const minSize = WCAG_STANDARDS.MIN_TOUCH_TARGET_SIZE;
  return {
    passes: width >= minSize && height >= minSize,
    width,
    height,
    required: minSize,
    severity: (width < minSize || height < minSize) ? SEVERITY_LEVELS.HIGH : null,
  };
}

/**
 * Validate text size and readability
 */
function validateTextReadability(fontSize, lineHeight, textLength) {
  const issues = [];
  
  // Check minimum text size
  if (fontSize < WCAG_STANDARDS.MIN_TEXT_SIZE) {
    issues.push({
      type: 'text_too_small',
      severity: SEVERITY_LEVELS.HIGH,
      message: `Text size ${fontSize}pt is below minimum of ${WCAG_STANDARDS.MIN_TEXT_SIZE}pt`,
      recommendation: 'Increase font size to at least 12pt for better readability',
    });
  }
  
  // Check line height
  const recommendedLineHeight = fontSize * 1.5;
  if (lineHeight && lineHeight < recommendedLineHeight) {
    issues.push({
      type: 'line_height_insufficient',
      severity: SEVERITY_LEVELS.MEDIUM,
      message: `Line height ${lineHeight}pt may be too tight for font size ${fontSize}pt`,
      recommendation: `Consider increasing line height to at least ${recommendedLineHeight}pt`,
    });
  }
  
  // Check line length for readability
  if (textLength && textLength > WCAG_STANDARDS.MAX_LINE_LENGTH) {
    issues.push({
      type: 'line_too_long',
      severity: SEVERITY_LEVELS.MEDIUM,
      message: `Text line with ${textLength} characters exceeds recommended maximum of ${WCAG_STANDARDS.MAX_LINE_LENGTH}`,
      recommendation: 'Consider breaking long text into shorter lines',
    });
  }
  
  return {
    passes: issues.length === 0,
    issues,
  };
}

/**
 * Validate component accessibility
 */
export function validateComponentAccessibility(componentProps) {
  const issues = [];
  const warnings = [];
  
  // Validate colors if provided
  if (componentProps.colors) {
    Object.entries(componentProps.colors).forEach(([key, colorPair]) => {
      if (colorPair.foreground && colorPair.background) {
        const contrastResult = validateColorContrast(
          colorPair.foreground,
          colorPair.background,
          colorPair.isLargeText
        );
        
        if (!contrastResult.passes) {
          issues.push({
            type: 'insufficient_contrast',
            severity: SEVERITY_LEVELS.CRITICAL,
            element: key,
            message: `Insufficient color contrast ratio: ${contrastResult.ratio.toFixed(2)}:1, required: ${contrastResult.required}:1`,
            recommendation: 'Adjust colors to meet WCAG AA contrast requirements',
            details: contrastResult,
          });
        } else if (contrastResult.level === 'AA') {
          warnings.push({
            type: 'contrast_borderline',
            element: key,
            message: `Color contrast meets AA but not AAA standards (${contrastResult.ratio.toFixed(2)}:1)`,
            recommendation: 'Consider improving contrast for AAA compliance',
          });
        }
      }
    });
  }
  
  // Validate touch targets
  if (componentProps.touchTargets) {
    componentProps.touchTargets.forEach((target, index) => {
      const sizeResult = validateTouchTargetSize(target.width, target.height);
      
      if (!sizeResult.passes) {
        issues.push({
          type: 'touch_target_too_small',
          severity: sizeResult.severity,
          element: target.id || `touch-target-${index}`,
          message: `Touch target size ${target.width}x${target.height}pt is below minimum ${sizeResult.required}pt`,
          recommendation: 'Increase touch target size to at least 44x44pt',
          details: sizeResult,
        });
      }
    });
  }
  
  // Validate text readability
  if (componentProps.textElements) {
    componentProps.textElements.forEach((textElement, index) => {
      const readabilityResult = validateTextReadability(
        textElement.fontSize,
        textElement.lineHeight,
        textElement.textLength
      );
      
      if (!readabilityResult.passes) {
        readabilityResult.issues.forEach(issue => {
          issues.push({
            ...issue,
            element: textElement.id || `text-element-${index}`,
          });
        });
      }
    });
  }
  
  // Validate accessibility properties
  if (componentProps.accessibilityProps) {
    const props = componentProps.accessibilityProps;
    
    if (!props.accessibilityLabel && !props.accessibilityLabelledBy) {
      issues.push({
        type: 'missing_accessibility_label',
        severity: SEVERITY_LEVELS.HIGH,
        message: 'Component is missing accessibility label',
        recommendation: 'Add accessibilityLabel or accessibilityLabelledBy prop',
      });
    }
    
    if (props.accessibilityRole === 'button' && !props.accessibilityHint) {
      warnings.push({
        type: 'missing_accessibility_hint',
        message: 'Interactive element missing accessibility hint',
        recommendation: 'Consider adding accessibilityHint for better user guidance',
      });
    }
  }
  
  return {
    passes: issues.length === 0,
    issues,
    warnings,
    summary: {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === SEVERITY_LEVELS.CRITICAL).length,
      highIssues: issues.filter(i => i.severity === SEVERITY_LEVELS.HIGH).length,
      mediumIssues: issues.filter(i => i.severity === SEVERITY_LEVELS.MEDIUM).length,
      lowIssues: issues.filter(i => i.severity === SEVERITY_LEVELS.LOW).length,
      totalWarnings: warnings.length,
    },
  };
}

/**
 * Check device accessibility settings
 */
export async function getAccessibilitySettings() {
  const settings = {};
  
  try {
    settings.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    settings.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
    
    if (Platform.OS === 'ios') {
      settings.isReduceTransparencyEnabled = await AccessibilityInfo.isReduceTransparencyEnabled();
      settings.isBoldTextEnabled = await AccessibilityInfo.isBoldTextEnabled();
      settings.isDarkerSystemColorsEnabled = await AccessibilityInfo.isDarkerSystemColorsEnabled();
    }
    
    // Get preferred content size category (iOS) or font scale (Android)
    if (Platform.OS === 'ios') {
      settings.preferredContentSizeCategory = await AccessibilityInfo.getPreferredContentSizeCategory();
    } else {
      settings.fontScale = await AccessibilityInfo.isGrayscaleEnabled(); // Android alternative
    }
    
    settings.isInvertColorsEnabled = await AccessibilityInfo.isInvertColorsEnabled();
    settings.isGrayscaleEnabled = await AccessibilityInfo.isGrayscaleEnabled();
    
  } catch (error) {
    console.warn('Error checking accessibility settings:', error);
  }
  
  return settings;
}

/**
 * Generate accessibility recommendations based on device settings
 */
export function generateAccessibilityRecommendations(settings) {
  const recommendations = [];
  
  if (settings.isScreenReaderEnabled) {
    recommendations.push({
      type: 'screen_reader_optimization',
      priority: 'high',
      message: 'Screen reader detected - ensure all elements have proper labels and roles',
      actions: [
        'Add descriptive accessibility labels',
        'Group related elements with accessibilityRole="group"',
        'Use semantic roles for interactive elements',
        'Provide context for dynamic content changes',
      ],
    });
  }
  
  if (settings.isReduceMotionEnabled) {
    recommendations.push({
      type: 'reduced_motion_adaptation',
      priority: 'high',
      message: 'Reduced motion enabled - disable or minimize animations',
      actions: [
        'Reduce animation duration to minimum',
        'Disable parallax and complex animations',
        'Use simple transitions only',
        'Respect prefers-reduced-motion setting',
      ],
    });
  }
  
  if (settings.isReduceTransparencyEnabled) {
    recommendations.push({
      type: 'transparency_reduction',
      priority: 'medium',
      message: 'Reduced transparency enabled - minimize glassmorphism effects',
      actions: [
        'Reduce blur effects intensity',
        'Increase background opacity',
        'Use solid colors where possible',
        'Ensure sufficient contrast with reduced transparency',
      ],
    });
  }
  
  if (settings.isBoldTextEnabled) {
    recommendations.push({
      type: 'bold_text_adaptation',
      priority: 'medium',
      message: 'Bold text enabled - adjust typography accordingly',
      actions: [
        'Increase font weights throughout interface',
        'Adjust spacing to accommodate bolder text',
        'Test layout with bold text enabled',
      ],
    });
  }
  
  if (settings.isDarkerSystemColorsEnabled) {
    recommendations.push({
      type: 'darker_colors_adaptation',
      priority: 'medium',
      message: 'Darker system colors enabled - increase contrast',
      actions: [
        'Use higher contrast color schemes',
        'Test with increased contrast ratios',
        'Ensure visibility with darker system colors',
      ],
    });
  }
  
  return recommendations;
}

/**
 * Validate specific component configurations for pose analysis
 */
export function validatePoseAnalysisAccessibility(componentType, props) {
  const validationProps = {};
  
  switch (componentType) {
    case 'FormScoreDisplay':
      validationProps.colors = [
        {
          foreground: props.scoreColor,
          background: props.backgroundColor,
          isLargeText: props.fontSize >= 18,
        },
        {
          foreground: props.textColor,
          background: props.backgroundColor,
          isLargeText: false,
        },
      ];
      
      validationProps.touchTargets = [
        {
          id: 'score-button',
          width: props.touchTargetWidth || 160,
          height: props.touchTargetHeight || 160,
        },
      ];
      
      validationProps.textElements = [
        {
          id: 'score-text',
          fontSize: props.fontSize || 32,
          lineHeight: props.lineHeight,
        },
        {
          id: 'description-text',
          fontSize: props.descriptionFontSize || 16,
          lineHeight: props.descriptionLineHeight,
          textLength: props.descriptionText?.length,
        },
      ];
      
      validationProps.accessibilityProps = {
        accessibilityLabel: props.accessibilityLabel,
        accessibilityRole: 'button',
        accessibilityHint: props.accessibilityHint,
      };
      break;
      
    case 'CircularProgressChart':
      validationProps.colors = [
        {
          foreground: props.textColor,
          background: props.backgroundColor,
          isLargeText: props.fontSize >= 18,
        },
        {
          foreground: props.progressColor,
          background: props.backgroundColor,
          isLargeText: false,
        },
      ];
      
      validationProps.textElements = [
        {
          id: 'progress-text',
          fontSize: props.fontSize || 24,
          lineHeight: props.fontSize * 1.2,
        },
      ];
      
      validationProps.accessibilityProps = {
        accessibilityLabel: props.accessibilityLabel,
        accessibilityRole: 'progressbar',
      };
      break;
      
    case 'ScoreBreakdownChart':
      validationProps.touchTargets = props.phaseScores?.map((phase, index) => ({
        id: `phase-${phase.phase}-${index}`,
        width: screenWidth - 32, // Assuming full-width cards with margins
        height: 60, // Estimated minimum height for phase cards
      })) || [];
      
      validationProps.textElements = props.phaseScores?.map((phase, index) => ({
        id: `phase-text-${index}`,
        fontSize: 16,
        lineHeight: 20,
        textLength: phase.description?.length,
      })) || [];
      
      validationProps.accessibilityProps = {
        accessibilityLabel: props.accessibilityLabel,
        accessibilityRole: 'list',
      };
      break;
      
    default:
      console.warn(`Unknown component type for accessibility validation: ${componentType}`);
      return { passes: true, issues: [], warnings: [] };
  }
  
  return validateComponentAccessibility(validationProps);
}

export default {
  validateComponentAccessibility,
  validatePoseAnalysisAccessibility,
  getAccessibilitySettings,
  generateAccessibilityRecommendations,
  validateColorContrast,
  validateTouchTargetSize,
  validateTextReadability,
  WCAG_STANDARDS,
  SEVERITY_LEVELS,
};