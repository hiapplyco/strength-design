# Design System Migration Guide

## Overview

This guide helps developers migrate existing components to use the new Strength.Design design system. The design system provides consistent tokens for colors, typography, spacing, and component variants.

## Quick Start

### 1. Import Design Tokens

Instead of hardcoding values, import tokens from the design system:

```typescript
import { 
  typography, 
  spacing, 
  sizes, 
  colors,
  radius,
  shadows,
  transitions,
  animations 
} from '@/lib/design-tokens';
```

### 2. Replace Hardcoded Values

#### Typography

**Before:**
```jsx
<h1 className="text-2xl font-bold">Title</h1>
<p className="text-sm text-gray-600">Description</p>
```

**After:**
```jsx
<h1 className={typography.display.h3}>Title</h1>
<p className={typography.body.small}>Description</p>
```

#### Spacing

**Before:**
```jsx
<div className="p-4 gap-2">
  <div className="mb-4">Content</div>
</div>
```

**After:**
```jsx
<div className={cn(spacing.component.md, spacing.gap.xs)}>
  <div className={spacing.margin.element}>Content</div>
</div>
```

#### Icons

**Before:**
```jsx
<ChevronDown className="h-4 w-4" />
```

**After:**
```jsx
<ChevronDown className={sizes.icon.sm} />
```

### 3. Use Card Variants

The Card component now supports multiple variants:

**Before:**
```jsx
<Card className="border shadow-sm">
  <CardContent>...</CardContent>
</Card>
```

**After:**
```jsx
<Card variant="flat">
  <CardContent>...</CardContent>
</Card>
```

Available variants:
- `default` - Gradient border effect
- `ghost` - Subtle with backdrop blur
- `elevated` - Strong shadow
- `interactive` - Hover effects
- `flat` - Simple bordered

### 4. Loading States

Use the standardized loading components:

**Before:**
```jsx
<Loader2 className="animate-spin h-4 w-4" />
```

**After:**
```jsx
<LoadingIndicator size="small" variant="primary">
  Loading...
</LoadingIndicator>
```

For workout generation:
```jsx
<WorkoutGenerating />
```

### 5. Responsive Design

Use responsive tokens for consistent breakpoints:

**Before:**
```jsx
<div className="text-sm sm:text-base lg:text-lg">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
```

**After:**
```jsx
<div className={typography.responsive.body}>
  <div className={cn("grid", responsive.grid[3])}>
```

## Component Migration Examples

### Button Migration

**Before:**
```jsx
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Click me
</button>
```

**After:**
```jsx
<Button variant="default" size="default">
  Click me
</Button>
```

### Badge Migration

**Before:**
```jsx
<span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
  Success
</span>
```

**After:**
```jsx
<Badge variant="success">Success</Badge>
```

### File Upload Migration

**Before:**
```jsx
<input type="file" className="hidden" />
<label className="cursor-pointer">
  <Upload className="h-4 w-4" />
</label>
```

**After:**
```jsx
<FileUpload onFileSelect={handleFile} />
```

## Utility Classes

### Using cn() for Combining Classes

Always use the `cn()` utility for combining classes:

```jsx
import { cn } from '@/lib/utils';

<div className={cn(
  spacing.component.lg,
  radius.lg,
  shadows.card,
  "custom-class"
)}>
```

### Animation Presets

Use predefined animations for consistency:

```jsx
<motion.div
  initial={animations.slideUp.initial}
  animate={animations.slideUp.animate}
  transition={animations.slideUp.transition}
>
```

## Testing Your Migration

1. **Visual Regression**: Compare before/after screenshots
2. **Responsive Testing**: Test all breakpoints
3. **Theme Testing**: Verify dark/light mode support
4. **Accessibility**: Check contrast ratios and touch targets

## Common Pitfalls

### ❌ Don't mix hardcoded values with tokens
```jsx
// Bad
<div className={cn(spacing.component.md, "p-4")}>
```

### ❌ Don't override design token values
```jsx
// Bad
<h1 className={cn(typography.display.h1, "text-2xl")}>
```

### ✅ Do use tokens consistently
```jsx
// Good
<div className={spacing.component.md}>
  <h1 className={typography.display.h1}>Title</h1>
</div>
```

## Resources

- **Design System Playground**: `/design-system` - Interactive component showcase
- **Design Tokens**: `/src/lib/design-tokens.ts` - All available tokens
- **Component Library**: `/src/components/ui/` - Standardized components

## Getting Help

If you encounter issues during migration:

1. Check the Design System Playground for examples
2. Review the design tokens file for available options
3. Look for similar components that have been migrated
4. Ask in the development channel

## Checklist

When migrating a component:

- [ ] Replace hardcoded colors with color tokens
- [ ] Replace hardcoded typography with typography tokens
- [ ] Replace hardcoded spacing with spacing tokens
- [ ] Replace hardcoded sizes with size tokens
- [ ] Use appropriate Card variant
- [ ] Use standardized loading states
- [ ] Test responsive behavior
- [ ] Test dark/light mode
- [ ] Update component tests
- [ ] Remove unused custom styles

---

*Last Updated: [Current Date]*  
*Design System Version: 1.0*