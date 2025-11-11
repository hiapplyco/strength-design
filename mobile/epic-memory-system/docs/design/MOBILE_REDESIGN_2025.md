# 📱 Mobile App 2025 Redesign Specification

> **Version**: 1.0.0  
> **Last Updated**: January 15, 2025  
> **Source**: Apply Health App redesign inspiration

## 🎯 Design Vision

**Goal:** Create a premium, calm, and fast fitness app experience with Oura-level polish while making workout tracking and discovery frictionless.

## 🌟 North Star Principles

### 1. Calm Performance
- **Dark-first UI** with soft depth and restrained color
- **Fast perceived speed** with skeletons and optimistic updates
- **Minimal cognitive load** through clear hierarchy

### 2. Personal, Not Generic
- **Adaptive accent colors** from system wallpaper
- **Personalized greetings** using user names
- **Time-aware suggestions** based on workout patterns
- **Contextual empty states** with helpful prompts

### 3. Motion as Meaning
- **Micro-interactions** that confirm success (haptics + springs)
- **Choreographed transitions** between screens
- **Lottie animations** for state changes and achievements

### 4. Touch-First Density
- **Large tap targets** (≥48px minimum)
- **8pt spacing grid** for consistency
- **Thumb-reachable controls** for one-handed use

### 5. Trust & Privacy
- **Privacy-first copy** ("Processed on-device when possible")
- **Granular sharing controls** for health data
- **Clear data provenance** (USDA badge for nutrition)

## 🎨 Visual Language 2025

### Color System

#### Dark Theme (Default)
```scss
// Backgrounds
$background: #0A0B0D;
$surface: #111216;
$glass-surface: rgba(255, 255, 255, 0.06);

// Text
$text-primary: #F5F7FA;
$text-secondary: #A7AEBC;
$text-tertiary: #7A8290;

// Borders
$border-default: #22242B;
$border-subtle: rgba(255, 255, 255, 0.08);

// Semantic
$positive: #34D399;
$warning: #F59E0B;
$danger: #F87171;
$info: #61BDF8;
```

#### Accent Presets
```scss
// Ocean (Default)
$accent-ocean: linear-gradient(135deg, #61BDF8 0%, #4C8EF7 100%);

// Forest
$accent-forest: linear-gradient(135deg, #4AD6B3 0%, #3BA986 100%);

// Sunrise (Current)
$accent-sunrise: linear-gradient(135deg, #FFB86B 0%, #FF7E87 100%);

// Amethyst
$accent-amethyst: linear-gradient(135deg, #B69CFF 0%, #7C6AF8 100%);
```

### Typography Scale
```scss
// Display
$display: 32px/38px; // Key numbers, hero text
font-weight: 700;

// Title
$title: 24px/28px; // Screen titles
font-weight: 600;

// Headline
$headline: 20px/24px; // Section headers
font-weight: 600;

// Body
$body: 16px/22px; // Primary content
font-weight: 400;

// Micro
$micro: 13px/18px; // Supporting text
font-weight: 400;

// Label
$label: 12px/16px; // Form labels, badges
font-weight: 500;
```

### Design Tokens
```scss
// Border Radius
$radius-xs: 8px;   // Badges, pills
$radius-sm: 12px;  // Buttons, inputs
$radius-md: 16px;  // Cards
$radius-lg: 20px;  // Modals
$radius-xl: 28px;  // Featured cards
$radius-2xl: 40px; // Full-screen modals

// Blur (Glass Effects)
$blur-nav: 28px;     // Navigation bars
$blur-modal: 24px;   // Modal overlays
$blur-card: 16px;    // Card surfaces
$blur-subtle: 12px;  // Inline elements

// Shadows
$shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.12);
$shadow-md: 0 6px 18px rgba(0, 0, 0, 0.15);
$shadow-lg: 0 12px 28px rgba(0, 0, 0, 0.18);

// Spacing
$space-1: 4px;
$space-2: 8px;
$space-3: 12px;
$space-4: 16px;
$space-5: 20px;
$space-6: 24px;
$space-8: 32px;
$space-10: 40px;
```

### Iconography
- **Style**: Duotone outline icons
- **Stroke**: 1.75-2px weight
- **Joints**: Rounded for softer appearance
- **Size**: 20px (small), 24px (default), 28px (large)

## 📱 Component Patterns

### Navigation
```typescript
// Bottom Tab Bar (Glass)
{
  background: 'rgba(17, 18, 22, 0.92)',
  backdropFilter: 'blur(28px)',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  paddingBottom: 'env(safe-area-inset-bottom)',
}

// Tab Icons
{
  inactive: '#7A8290',
  active: 'accent-gradient',
  size: 24,
  style: 'duotone',
}
```

### Cards
```typescript
// Workout Card
{
  background: 'rgba(255, 255, 255, 0.06)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 16,
  shadow: '0 6px 18px rgba(0, 0, 0, 0.15)',
}

// Interactive States
{
  hover: 'scale(1.02)',
  pressed: 'scale(0.98)',
  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
}
```

### Forms
```typescript
// Input Field
{
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 12,
  height: 48,
  padding: '0 16px',
  fontSize: 16,
  
  // Focus State
  focused: {
    border: '1px solid accent',
    background: 'rgba(255, 255, 255, 0.06)',
  }
}

// Buttons
{
  primary: {
    background: 'accent-gradient',
    height: 48,
    borderRadius: 12,
    fontWeight: 600,
  },
  
  secondary: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  },
  
  ghost: {
    background: 'transparent',
    padding: '8px 12px',
  }
}
```

## 🎬 Motion Design

### Timing Functions
```scss
$ease-out: cubic-bezier(0.0, 0, 0.2, 1);
$ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
$spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Animation Durations
```scss
$instant: 100ms;  // Micro-interactions
$fast: 200ms;     // Button presses
$normal: 300ms;   // Screen transitions
$slow: 400ms;     // Complex animations
```

### Haptic Feedback
```typescript
// Success Actions
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Selection Changes
Haptics.selectionAsync();

// Impact (Heavy Actions)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

## 📊 Data Visualization

### Charts
- **Ring charts** for progress (minimal, no cluttered legends)
- **Sparklines** for trends (subtle gradients)
- **Bar charts** for comparisons (rounded corners)

### Progress Indicators
```typescript
// Ring Progress
{
  size: 120,
  strokeWidth: 12,
  trackColor: 'rgba(255, 255, 255, 0.08)',
  progressColor: 'accent-gradient',
  animationDuration: 1000,
  animationEasing: 'ease-out',
}

// Linear Progress
{
  height: 8,
  borderRadius: 4,
  background: 'rgba(255, 255, 255, 0.08)',
  progress: 'accent-gradient',
}
```

## 🌈 Personalization

### Dynamic Theming
1. **System Integration**: Respect iOS Dynamic Color / Android Material You
2. **User Preferences**: Allow manual accent color selection
3. **Time-Based**: Adapt UI brightness based on time of day
4. **Context-Aware**: Highlight relevant features based on usage patterns

### Adaptive Content
- Morning: "Ready for your morning workout, [Name]?"
- Evening: "Time to wind down with stretching, [Name]"
- Post-workout: "Great job! Recovery is important too"
- Milestone: "You're on a 7-day streak! 🔥"

## ♿ Accessibility

### Requirements
- **Touch Targets**: Minimum 44x44pt (48x48pt preferred)
- **Contrast Ratios**: 4.5:1 for normal text, 3:1 for large text
- **Motion**: Respect `prefers-reduced-motion`
- **Screen Reader**: Full VoiceOver/TalkBack support
- **Dynamic Type**: Support system font scaling

### Implementation
```typescript
// Accessible Component
{
  accessible: true,
  accessibilityLabel: 'Start workout',
  accessibilityHint: 'Double tap to begin your workout',
  accessibilityRole: 'button',
  accessibilityState: { selected: isActive },
}
```

## 🚀 Performance Guidelines

### Optimization Targets
- **App Launch**: < 2 seconds
- **Screen Transition**: < 300ms
- **API Response**: < 200ms (with loading state)
- **Animation FPS**: 60fps minimum
- **Bundle Size**: < 50MB initial download

### Best Practices
1. **Lazy Loading**: Load screens on-demand
2. **Image Optimization**: Use WebP, progressive loading
3. **Caching**: Aggressive caching with smart invalidation
4. **Offline First**: Local database with sync
5. **Optimistic Updates**: Update UI before server confirmation

## 📝 Implementation Checklist

### Phase 1: Foundation
- [ ] Implement dark theme with glass effects
- [ ] Create typography system
- [ ] Build component library
- [ ] Add haptic feedback
- [ ] Implement motion system

### Phase 2: Personalization
- [ ] Dynamic accent colors
- [ ] Time-aware content
- [ ] User preferences
- [ ] Adaptive layouts
- [ ] Custom themes

### Phase 3: Polish
- [ ] Micro-animations
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Celebration moments

---

> **Note**: This design specification represents the future vision for the Strength.Design mobile app, inspired by premium fitness apps like Oura while maintaining our unique brand identity.