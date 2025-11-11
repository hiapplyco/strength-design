# 🎨 Design System 2025 - Premium Glass Morphism

## Overview

A sophisticated, modern design system featuring glass morphism effects, dark-first aesthetics, and premium gradient accents. This system creates a cohesive, professional experience across all platforms.

## 🎨 Color Palette

### Primary Colors
```css
--color-background: #0A0B0D;        /* Dark base */
--color-surface: rgba(255,255,255,0.06);  /* Glass surface */
--color-surface-hover: rgba(255,255,255,0.08);
--color-surface-active: rgba(255,255,255,0.10);
```

### Text Colors
```css
--color-text-primary: #F5F7FA;      /* High contrast */
--color-text-secondary: #A7AEBC;    /* Supporting text */
--color-text-tertiary: #6B7280;     /* Subtle text */
--color-text-disabled: #4B5563;     /* Disabled state */
```

### Accent Colors
```css
--color-accent-primary: #FFB86B;    /* Warm orange */
--color-accent-secondary: #FF7E87;  /* Coral pink */
--color-accent-gradient: linear-gradient(135deg, #FFB86B 0%, #FF7E87 100%);
```

### Semantic Colors
```css
--color-success: #34D399;           /* Positive green */
--color-success-bg: rgba(52, 211, 153, 0.15);
--color-error: #FF7E87;             /* Error red */
--color-error-bg: rgba(255, 126, 135, 0.15);
--color-warning: #FBBF24;           /* Warning yellow */
--color-info: #60A5FA;              /* Info blue */
```

### Border Colors
```css
--color-border: #22242B;            /* Subtle borders */
--color-border-light: rgba(255,255,255,0.1);
--color-border-accent: rgba(255, 184, 107, 0.3);
```

## 🪟 Glass Morphism Properties

### Standard Glass Surface
```javascript
const glassSurface = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)', // Safari support
  borderWidth: 1,
  borderColor: '#22242B',
  borderRadius: 16,
};
```

### Glass Variations
```javascript
// Light glass (for overlays)
const lightGlass = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(10px)',
};

// Heavy glass (for modals)
const heavyGlass = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(30px)',
};

// Colored glass (for accents)
const accentGlass = {
  backgroundColor: 'rgba(255, 184, 107, 0.15)',
  backdropFilter: 'blur(20px)',
  borderColor: 'rgba(255, 184, 107, 0.3)',
};
```

## 📐 Typography Scale

### Font Sizes
```javascript
const typography = {
  // Headings
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  
  // Body
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  small: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  tiny: { fontSize: 11, fontWeight: '500', lineHeight: 16 },
  
  // Special
  button: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
};
```

## 🎛 Component Patterns

### Cards
```javascript
const cardStyles = {
  // Default card
  default: {
    ...glassSurface,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3, // Android
  },
  
  // Elevated card
  elevated: {
    ...glassSurface,
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  
  // Interactive card
  interactive: {
    ...glassSurface,
    transform: [{ scale: 1 }],
    // On press: scale(0.98)
    // On hover: backgroundColor: rgba(255,255,255,0.08)
  },
};
```

### Buttons
```javascript
const buttonStyles = {
  // Primary button (gradient)
  primary: {
    background: 'linear-gradient(135deg, #FFB86B 0%, #FF7E87 100%)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#FFB86B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  // Secondary button (glass)
  secondary: {
    ...glassSurface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderColor: '#FFB86B',
  },
  
  // Ghost button
  ghost: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
};
```

### Input Fields
```javascript
const inputStyles = {
  container: {
    ...glassSurface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  input: {
    flex: 1,
    color: '#F5F7FA',
    fontSize: 15,
    fontWeight: '500',
  },
  
  focused: {
    borderColor: '#FFB86B',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
};
```

### Pills & Chips
```javascript
const pillStyles = {
  // Category pill
  category: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: '#22242B',
  },
  
  // Active pill
  active: {
    backgroundColor: 'rgba(255, 184, 107, 0.15)',
    borderColor: '#FFB86B',
  },
  
  // Macro pills (nutrition)
  protein: {
    backgroundColor: 'rgba(139, 92, 70, 0.15)',
    borderColor: 'rgba(139, 92, 70, 0.3)',
  },
  carbs: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  fat: {
    backgroundColor: 'rgba(255, 184, 107, 0.15)',
    borderColor: 'rgba(255, 184, 107, 0.3)',
  },
};
```

## 📏 Spacing System

### Base Unit: 4px
```javascript
const spacing = {
  xs: 4,   // Tight spacing
  sm: 8,   // Small elements
  md: 12,  // Default spacing
  lg: 16,  // Content padding
  xl: 20,  // Section spacing
  xxl: 24, // Large gaps
  xxxl: 32 // Hero sections
};
```

### Layout Grid
```javascript
const layout = {
  containerPadding: 15,
  cardPadding: 16,
  sectionGap: 20,
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    full: 9999,
  },
};
```

## ✨ Animation Guidelines

### Timing
```javascript
const animations = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
};
```

### Common Animations
```javascript
// Fade in
fadeIn: {
  from: { opacity: 0 },
  to: { opacity: 1 },
  duration: 300,
}

// Scale press
scalePress: {
  from: { scale: 1 },
  to: { scale: 0.98 },
  duration: 100,
}

// Slide up
slideUp: {
  from: { translateY: 20, opacity: 0 },
  to: { translateY: 0, opacity: 1 },
  duration: 300,
}
```

## 🎯 Interaction States

### Touch/Hover States
```javascript
const interactionStates = {
  default: {
    opacity: 1,
    scale: 1,
  },
  hover: {
    opacity: 0.9,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pressed: {
    opacity: 0.8,
    scale: 0.98,
  },
  disabled: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
};
```

## 📱 Platform Considerations

### Mobile Optimizations
- **Touch targets**: Minimum 44x44 points
- **Haptic feedback**: Light impact on interactions
- **Safe areas**: Respect device insets
- **Gestures**: Swipe actions for navigation

### Web Optimizations
- **Hover states**: Enhanced desktop interactions
- **Keyboard navigation**: Focus indicators
- **Responsive breakpoints**: 640px, 768px, 1024px
- **Performance**: CSS transforms over JS animations

## ♿ Accessibility Standards

### Color Contrast
- **Normal text**: 7:1 ratio (AAA)
- **Large text**: 4.5:1 ratio (AA)
- **Interactive elements**: 3:1 minimum

### Focus Indicators
```javascript
const focusStyle = {
  outline: '2px solid #FFB86B',
  outlineOffset: 2,
  borderRadius: 8,
};
```

### Screen Reader Support
- Semantic HTML elements
- ARIA labels for icons
- Role attributes for custom components
- Descriptive alt text for images

## 🚀 Implementation Checklist

### Component Requirements
- [ ] Glass morphism effects applied
- [ ] Dark background (#0A0B0D)
- [ ] Proper text contrast
- [ ] 16px border radius
- [ ] Gradient accents where appropriate
- [ ] Shadow/elevation for depth
- [ ] Smooth animations (300ms)
- [ ] Touch/hover states
- [ ] Accessibility compliance

### Quality Assurance
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Dark mode only (no light theme)
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Design consistency review

## 📝 Usage Examples

### Creating a Premium Card
```javascript
const PremiumCard = ({ children, onPress }) => (
  <TouchableOpacity 
    style={[
      styles.glassSurface,
      styles.cardPadding,
      { marginBottom: 12 }
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {children}
  </TouchableOpacity>
);
```

### Gradient Button
```javascript
const GradientButton = ({ title, onPress }) => (
  <TouchableOpacity 
    style={styles.primaryButton}
    onPress={onPress}
    activeOpacity={0.9}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);
```

### Glass Input Field
```javascript
const GlassInput = ({ value, onChangeText, placeholder }) => (
  <View style={styles.inputContainer}>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#A7AEBC"
    />
  </View>
);
```

---

## 🎊 Result

Following this design system creates a **premium, cohesive, and modern** user experience that:
- Maintains consistency across all platforms
- Provides excellent readability and accessibility
- Creates visual hierarchy through glass layers
- Delivers a sophisticated, professional appearance
- Ensures smooth, delightful interactions

**Design System Version**: 1.0.0  
**Last Updated**: January 13, 2025  
**Status**: 🟢 Production Ready