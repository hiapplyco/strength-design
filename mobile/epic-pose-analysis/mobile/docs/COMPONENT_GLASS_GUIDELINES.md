# Component Glass Guidelines
## Liquid Glass Implementation for Strength.Design Components

### 🎯 Overview

This guide provides specific implementation details for applying the Liquid Glass design philosophy to Strength.Design mobile components. Each component section includes light/dark mode variants, accessibility considerations, and performance optimizations.

---

## 🏠 Home Screen Components

### Hero Section
The main welcome area with app branding and primary navigation.

**Light Mode Implementation:**
```javascript
const heroStyles = {
  container: {
    ...theme.createGlassEffect('subtle', 'light'),
    paddingTop: spacing.layout.safeArea.top + spacing[5],
    paddingHorizontal: spacing.layout.screenPadding.horizontal,
    paddingBottom: spacing[8],
    borderRadius: borderRadius.none, // Full width
  },
  welcomeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.light.text.secondary,
    ...typography.textShadow.light.subtle,
    marginBottom: spacing[1],
  },
  appName: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.heavy,
    color: colors.light.text.primary,
    ...typography.textShadow.light.medium,
  },
};
```

**Dark Mode Implementation:**
```javascript
const heroStylesDark = {
  container: {
    ...theme.createGlassEffect('subtle', 'dark'),
    paddingTop: spacing.layout.safeArea.top + spacing[5],
    paddingHorizontal: spacing.layout.screenPadding.horizontal,
    paddingBottom: spacing[8],
    borderRadius: borderRadius.none,
  },
  welcomeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.dark.text.secondary,
    ...typography.textShadow.dark.subtle,
    marginBottom: spacing[1],
  },
  appName: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.heavy,
    color: colors.dark.text.primary,
    ...typography.textShadow.dark.medium,
  },
};
```

### Quick Action Cards
Primary navigation cards for core app features.

**Glass Card Implementation:**
```javascript
const quickActionCard = (theme) => ({
  container: {
    ...components.card.glass[theme],
    marginBottom: spacing[4],
    minHeight: spacing.interactive.touch.comfortable,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  icon: {
    width: 48,
    height: 48,
    marginRight: spacing[4],
    borderRadius: borderRadius.lg,
    ...theme === 'light' ? shadows.light.glow : shadows.dark.glow,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: theme === 'light' ? colors.light.text.primary : colors.dark.text.primary,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: theme === 'light' ? colors.light.text.secondary : colors.dark.text.secondary,
    lineHeight: typography.lineHeight.normal,
  },
  // Press state animation
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
```

---

## 💪 Workout Generation Screen

### AI Chat Interface
The conversation interface for AI workout generation.

**Chat Bubble System:**
```javascript
const chatBubbles = {
  user: (theme) => ({
    container: {
      alignSelf: 'flex-end',
      maxWidth: '80%',
      marginVertical: spacing[2],
      marginHorizontal: spacing[4],
    },
    bubble: {
      backgroundColor: theme === 'light' ? colors.primary.DEFAULT : colors.primary.light,
      borderRadius: borderRadius.lg,
      borderBottomRightRadius: borderRadius.sm,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[4],
      ...theme === 'light' ? shadows.light.sm : shadows.dark.sm,
    },
    text: {
      color: '#FFFFFF',
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.normal,
      fontWeight: typography.fontWeight.normal,
    },
  }),
  
  assistant: (theme) => ({
    container: {
      alignSelf: 'flex-start',
      maxWidth: '85%',
      marginVertical: spacing[2],
      marginHorizontal: spacing[4],
    },
    bubble: {
      ...theme.createGlassEffect('medium', theme),
      borderRadius: borderRadius.lg,
      borderBottomLeftRadius: borderRadius.sm,
      paddingVertical: spacing[4],\n      paddingHorizontal: spacing[4],
      borderWidth: 1,
      borderColor: theme === 'light' ? colors.light.border.medium : colors.dark.border.medium,
    },
    text: {
      color: theme === 'light' ? colors.light.text.primary : colors.dark.text.primary,
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.relaxed,
      fontWeight: typography.fontWeight.normal,
    },
  }),
  
  thinking: (theme) => ({
    container: {
      alignSelf: 'flex-start',
      marginVertical: spacing[2],
      marginHorizontal: spacing[4],
    },
    bubble: {
      ...theme.createGlassEffect('subtle', theme),
      borderRadius: borderRadius.lg,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[4],
      borderWidth: 1,
      borderColor: theme === 'light' ? colors.light.border.light : colors.dark.border.light,
    },
    // Animated thinking indicator
    indicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  }),
};
```

### Input Field
The message input area with glass styling.

```javascript
const chatInput = (theme) => ({
  container: {
    ...theme.createGlassEffect('strong', theme),
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme === 'light' ? colors.light.border.light : colors.dark.border.light,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: spacing.layout.safeArea.bottom,
  },
  textInput: {
    flex: 1,
    ...components.input.glass[theme],
    minHeight: spacing.interactive.touch.minimum,
    maxHeight: spacing[20],
    marginRight: spacing[2],
    paddingTop: Platform.OS === 'ios' ? spacing[3] : spacing[2],
  },
  sendButton: {
    ...components.button.primary[theme],
    width: spacing.interactive.touch.minimum,
    height: spacing.interactive.touch.minimum,
    borderRadius: borderRadius.full,
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

---

## 📚 Exercise Library

### Search Interface
Glass-enhanced search with filters and suggestions.

```javascript
const searchInterface = (theme) => ({
  container: {
    ...theme.createGlassEffect('medium', theme),
    paddingTop: spacing.layout.safeArea.top,
    paddingHorizontal: spacing.layout.screenPadding.horizontal,
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme === 'light' ? colors.light.border.light : colors.dark.border.light,
  },
  searchInput: {
    ...components.input.glass[theme],
    marginBottom: spacing[3],
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterButton: (isActive) => ({
    ...components.button.ghost[theme],
    borderWidth: 1,
    borderColor: isActive 
      ? (theme === 'light' ? colors.primary.DEFAULT : colors.primary.light)
      : (theme === 'light' ? colors.light.border.medium : colors.dark.border.medium),
    backgroundColor: isActive
      ? (theme === 'light' ? colors.primary.glass : `${colors.primary.light}20`)
      : 'transparent',
    marginRight: spacing[2],
  }),
});
```

### Exercise Cards
Showcase individual exercises with glass treatment.

```javascript
const exerciseCard = (theme) => ({
  container: {
    ...components.card.glass[theme],
    marginHorizontal: spacing.layout.screenPadding.horizontal,
    marginVertical: spacing[2],
  },
  imageContainer: {
    height: 200,
    borderRadius: borderRadius.component.glass.medium,
    overflow: 'hidden',
    marginBottom: spacing[3],
    backgroundColor: theme === 'light' ? colors.light.background.tertiary : colors.dark.background.tertiary,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    paddingHorizontal: spacing[1],
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: theme === 'light' ? colors.light.text.primary : colors.dark.text.primary,
    marginBottom: spacing[1],
  },
  category: {
    fontSize: typography.fontSize.sm,
    color: theme === 'light' ? colors.light.text.accent : colors.dark.text.accent,
    marginBottom: spacing[2],
    fontWeight: typography.fontWeight.medium,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: theme === 'light' ? colors.light.text.secondary : colors.dark.text.secondary,
    lineHeight: typography.lineHeight.relaxed,
    marginBottom: spacing[3],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficulty: (level) => ({
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.base,
    backgroundColor: getDifficultyColor(level, theme),
  }),
});
```

---

## 🏃‍♂️ Active Workout Screen

### Timer Display
Large, prominent timer with glass background.

```javascript
const workoutTimer = (theme) => ({
  container: {
    ...theme.createGlassEffect('strong', theme),
    alignItems: 'center',
    paddingVertical: spacing[6],
    marginHorizontal: spacing.layout.screenPadding.horizontal,
    marginVertical: spacing[4],
    borderRadius: borderRadius.component.card.lg,
    borderWidth: 2,
    borderColor: theme === 'light' ? colors.primary.DEFAULT : colors.primary.light,
    ...theme === 'light' ? shadows.light.glow : shadows.dark.glow,
  },
  timeDisplay: {
    fontSize: typography.fontSize['6xl'],
    fontWeight: typography.fontWeight.black,
    color: theme === 'light' ? colors.primary.DEFAULT : colors.primary.light,
    fontFamily: typography.fontFamily.mono,
    ...typography.textShadow[theme].medium,
  },
  label: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: theme === 'light' ? colors.light.text.secondary : colors.dark.text.secondary,
    marginTop: spacing[2],
  },
  controls: {
    flexDirection: 'row',
    marginTop: spacing[4],
    gap: spacing[4],
  },
});
```

### Exercise Progress Cards
Track sets, reps, and weights with glass styling.

```javascript
const progressCard = (theme) => ({
  container: {
    ...components.card.workout[theme],
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  exerciseName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: theme === 'light' ? colors.light.text.primary : colors.dark.text.primary,
    flex: 1,
  },
  setCounter: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: theme === 'light' ? colors.light.text.accent : colors.dark.text.accent,
    backgroundColor: theme === 'light' ? colors.light.background.glass.subtle : colors.dark.background.glass.subtle,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.base,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  input: {
    ...components.input.glass[theme],
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    color: theme === 'light' ? colors.light.text.tertiary : colors.dark.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  completeButton: {
    ...components.button.primary[theme],
    marginTop: spacing[2],
  },
});
```

---

## 🔧 Settings & Profile

### Settings List
Glass-styled settings items with proper touch targets.

```javascript
const settingsItem = (theme) => ({
  container: {
    ...components.card.glass[theme],
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    marginHorizontal: spacing.layout.screenPadding.horizontal,
    marginVertical: spacing[1],
    minHeight: spacing.interactive.touch.comfortable,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: spacing[3],
    color: theme === 'light' ? colors.light.text.accent : colors.dark.text.accent,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: theme === 'light' ? colors.light.text.primary : colors.dark.text.primary,
    marginBottom: spacing[0.5],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: theme === 'light' ? colors.light.text.secondary : colors.dark.text.secondary,
  },
  accessory: {
    marginLeft: spacing[2],
  },
  chevron: {
    color: theme === 'light' ? colors.light.text.tertiary : colors.dark.text.tertiary,
  },
});
```

---

## 📱 Navigation Components

### Tab Bar
Glass-enhanced bottom navigation.

```javascript
const tabBar = (theme) => ({
  container: {
    ...components.navigation.tab[theme],
    paddingBottom: spacing.layout.safeArea.bottom,
    paddingTop: spacing[3],
    paddingHorizontal: spacing[2],
  },
  tab: (isActive) => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[1],
    borderRadius: borderRadius.lg,
    backgroundColor: isActive 
      ? (theme === 'light' ? colors.light.background.glass.subtle : colors.dark.background.glass.subtle)
      : 'transparent',
  }),
  icon: (isActive) => ({
    marginBottom: spacing[1],
    color: isActive 
      ? (theme === 'light' ? colors.primary.DEFAULT : colors.primary.light)
      : (theme === 'light' ? colors.light.text.tertiary : colors.dark.text.tertiary),
  }),
  label: (isActive) => ({
    fontSize: typography.fontSize.xs,
    fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.normal,
    color: isActive 
      ? (theme === 'light' ? colors.primary.DEFAULT : colors.primary.light)
      : (theme === 'light' ? colors.light.text.tertiary : colors.dark.text.tertiary),
  }),
});
```

### Header Bar
Sticky header with glass background.

```javascript
const headerBar = (theme) => ({
  container: {
    ...components.navigation.header[theme],
    paddingTop: spacing.layout.safeArea.top,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: spacing.layout.safeArea.top + spacing[12],
  },
  backButton: {
    ...components.button.ghost[theme],
    width: spacing.interactive.touch.minimum,
    height: spacing.interactive.touch.minimum,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: theme === 'light' ? colors.light.text.primary : colors.dark.text.primary,
    textAlign: 'center',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
});
```

---

## 🎨 Accessibility Implementation

### High Contrast Support
For users who prefer increased contrast.

```javascript
const highContrastVariants = {
  card: (theme) => ({
    ...components.card.glass[theme],
    borderWidth: 2,
    borderColor: theme === 'light' ? colors.light.text.primary : colors.dark.text.primary,
    backgroundColor: theme === 'light' ? '#FFFFFF' : colors.dark.background.secondary,
  }),
  button: (theme) => ({
    ...components.button.primary[theme],
    borderWidth: 2,
    borderColor: theme === 'light' ? colors.primary.dark : colors.primary.light,
  }),
};
```

### Reduced Motion Support
Simplified animations for accessibility.

```javascript
const reducedMotionStyles = {
  // Disable blur effects
  glassEffect: (theme) => ({
    backgroundColor: theme === 'light' ? colors.light.background.elevated : colors.dark.background.secondary,
    borderWidth: 1,
    borderColor: theme === 'light' ? colors.light.border.medium : colors.dark.border.medium,
    // Remove backdrop-filter
  }),
  // Static button states
  button: {
    // Remove scale transforms
    // Remove opacity transitions
  },
};
```

---

## ⚡ Performance Optimization

### Simplified Glass for Lower-End Devices
Reduce complexity while maintaining brand aesthetic.

```javascript
const performanceOptimized = {
  glassCard: (theme) => ({
    backgroundColor: theme === 'light' 
      ? colors.light.background.glass.subtle 
      : colors.dark.background.glass.subtle,
    borderWidth: 1,
    borderColor: theme === 'light' ? colors.light.border.light : colors.dark.border.light,
    borderRadius: borderRadius.component.glass.medium,
    // Omit backdrop-filter and complex shadows
    ...theme === 'light' ? shadows.light.sm : shadows.dark.sm,
  }),
};
```

---

## 📋 Implementation Checklist

### Design Validation
- [ ] All glass effects enhance rather than hinder readability
- [ ] Text maintains 4.5:1+ contrast ratio on glass backgrounds
- [ ] Touch targets meet minimum 44px requirement
- [ ] Animations respect reduced motion preferences

### Theme Consistency
- [ ] Light/dark mode variants for all components
- [ ] Proper theme switching without visual artifacts
- [ ] Consistent glass intensity across related components
- [ ] Brand colors remain accessible across all themes

### Performance
- [ ] Glass effects degrade gracefully on older devices
- [ ] Maximum 3 active backdrop filters on screen simultaneously
- [ ] Animations maintain 60fps on target devices
- [ ] Memory usage remains stable during theme switches

### Accessibility
- [ ] Screen reader compatibility maintained
- [ ] High contrast mode fallbacks implemented
- [ ] Keyboard navigation support for interactive elements
- [ ] Focus indicators work effectively on glass backgrounds

---

*This component guide ensures consistent implementation of the Liquid Glass philosophy across all Strength.Design mobile components while maintaining performance and accessibility standards.*