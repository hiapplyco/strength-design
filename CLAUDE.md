# Strength.Design - AI Claude Development Guide

## Project Overview

Strength.Design is an AI-powered fitness platform that creates personalized workout plans through conversational interfaces. This guide provides essential development patterns, design system, and implementation standards for the project.

**Status**: Web platform complete, Mobile app development starting

## Quick Start

```bash
# Clone and setup
git clone https://github.com/yourusername/strength-design.git
cd strength-design
npm install
cp .env.example .env.local

# Development
npm run dev          # Start dev server
npm run typecheck    # Type checking
npm run lint         # Linting
npm run test         # Testing
npm run build        # Production build
```

## Design System

### Core Principles
1. **Consistency**: Unified patterns across all components
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Performance**: Optimized loading and rendering
4. **Mobile-first**: Touch-optimized, responsive design
5. **Delightful**: Purposeful animations and interactions

### Design Tokens (`src/lib/design-tokens.ts`)

```typescript
// Colors
primary: "hsl(25 95% 53%)"     // Warm orange
success: "hsl(142 71% 45%)"    // Green
gradients: {
  border: "from-[#4CAF50] via-[#9C27B0] to-[#FF1493]",
  sunset: "from-orange-400 via-red-500 to-pink-500",
}

// Typography (Tailwind classes)
h1: "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
h2: "text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight"
body: "text-sm sm:text-base"

// Spacing
component: { xs: "p-2", sm: "p-3", md: "p-4", lg: "p-6", xl: "p-8" }
gap: { xs: "gap-2", sm: "gap-3", md: "gap-4", lg: "gap-6", xl: "gap-8" }
```

### Component Variants

```typescript
// Card variants
cardVariants = {
  default: "gradient-border shadow-sm",    // With animated gradient
  ghost: "bg-card/50 backdrop-blur-sm",   // Subtle UI
  elevated: "shadow-lg border-border/20",  // Important content
  interactive: "hover:scale-[1.02]",       // Clickable cards
}

// Button usage
buttonGuidelines = {
  primary: "variant='default'",      // Save, Submit, Generate
  secondary: "variant='outline'",    // Cancel, Back
  destructive: "variant='destructive'", // Delete, Remove
  navigation: "variant='ghost'",     // Links, breadcrumbs
  icon: "variant='ghost' size='icon'", // Icon-only
}
```

### Key Components

**StandardPageLayout** - Wrap ALL pages
```tsx
<StandardPageLayout title="Page Title" showBack={true}>
  {/* content */}
</StandardPageLayout>
```

**SectionContainer** - Group content
```tsx
<SectionContainer title="Section" variant="default" spacing="md">
  {/* content */}
</SectionContainer>
```

**EmptyState** - No data states
```tsx
<EmptyState 
  icon={<FileText />} 
  title="No workouts yet"
  action={<Button>Create</Button>}
/>
```

**Toast patterns**
```typescript
toast.success("Saved!");
toast.error("Failed!");
toast.info("Tip: ...");
toast.loading("Loading...");
```


## Architecture & Patterns

### Directory Structure
```
src/
├── components/
│   ├── ui/          # Base UI components (shadcn)
│   ├── layout/      # Layout components
│   ├── workout/     # Workout-specific
│   └── shared/      # Shared components
├── pages/           # Route pages
├── hooks/           # Custom React hooks
├── lib/             # Utilities and helpers
├── services/        # API services
└── types/           # TypeScript types
```

### Component Pattern
```tsx
interface ComponentProps {
  variant?: "default" | "ghost";
  className?: string;
  children: React.ReactNode;
}

export function Component({ 
  variant = "default", 
  className,
  children 
}: ComponentProps) {
  return (
    <div className={cn(variants[variant], className)}>
      {children}
    </div>
  );
}
```

### Hook Pattern
```typescript
export function useExample() {
  const [state, setState] = useState();
  
  const computed = useMemo(() => compute(state), [state]);
  const handler = useCallback((x) => handle(x), [dep]);
  
  useEffect(() => {
    // Effect
    return () => cleanup();
  }, []);
  
  return { state, computed, handler };
}
```

## Current Status

### ✅ Completed Features
- **Authentication**: Email, social (Google/Apple), phone
- **AI Workout Generation**: Chat-based workout creation
- **Exercise Library**: Categorized exercise database
- **Workout Templates**: Save and reuse workouts
- **Program Search**: Perplexity AI integration for popular programs
- **Design System**: Unified components and tokens
- **Real-time Updates**: Live notifications and updates

### 🚧 In Development
- **Mobile App**: React Native with Expo (starting fresh)
- **AI Personalities**: Custom trainer voices and styles
- **Advanced Analytics**: Progress tracking and insights

### 📋 Planned Features
- **Gamification**: Achievements, XP, levels
- **Social Features**: Share workouts, follow users
- **Video Analysis**: Form checking with AI
- **Health Integration**: Apple Health, Google Fit
- **Payment System**: Stripe for premium features

## Mobile Development Plan

### Technology Stack
```json
{
  "framework": "React Native with Expo SDK 50+",
  "navigation": "React Navigation v6",
  "state": "TanStack Query + Zustand",
  "ui": "NativeWind (Tailwind for RN)",
  "backend": "Shared Supabase instance"
}
```

### MVP Timeline (4 weeks)
1. **Week 1**: Project setup, authentication
2. **Week 2-3**: Core workout features, offline support
3. **Week 3-4**: Testing, polish, beta release

### Shared Code Strategy
```
packages/
├── shared/       # Shared types, API, utils
├── web/          # Current web app
└── mobile/       # New React Native app
```

## Testing Standards

### Test Requirements
- Unit tests for all utilities and hooks
- Component tests for UI components
- Integration tests for API endpoints
- E2E tests for critical user flows

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Performance Optimization

### Key Metrics
- **Bundle size**: < 200KB JS, < 50KB CSS
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Lighthouse score**: > 90 for all categories

### Optimization Checklist
- [ ] Lazy load routes and heavy components
- [ ] Optimize images (WebP, proper sizing)
- [ ] Implement virtual scrolling for long lists
- [ ] Use React.memo for expensive components
- [ ] Debounce user inputs
- [ ] Cache API responses

## Key Development Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled, no `any` types
- **Components**: < 200 lines, single responsibility
- **Styling**: Use Tailwind classes, avoid inline styles
- **State**: Prefer React Query for server state
- **Performance**: Memoize expensive operations
- **Accessibility**: ARIA labels, keyboard navigation

### Git Workflow
```bash
# Branch naming
feature/description
fix/issue-description
chore/task-description

# Commit format
feat(scope): add new feature
fix(scope): resolve issue
docs(scope): update documentation
style(scope): formatting changes
refactor(scope): code improvements
test(scope): add tests
chore(scope): maintenance tasks
```

### Before Committing
1. Run `npm run typecheck`
2. Run `npm run lint`
3. Run `npm test`
4. Verify no console errors
5. Check responsive design

## Environment Variables

### Required Variables
```env
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=false

# API Keys (server-side only)
PERPLEXITY_API_KEY=your-key  # In Supabase edge functions
```

## Quick Reference Checklists

### New Component Checklist
- [ ] Uses TypeScript with proper types
- [ ] Follows component pattern from guide
- [ ] Uses design tokens for styling
- [ ] Includes loading/error states
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Has unit tests

### PR Checklist
- [ ] Tests pass
- [ ] No TypeScript errors
- [ ] Lint errors resolved
- [ ] Responsive design verified
- [ ] Documentation updated if needed
- [ ] No console.log statements

### Performance Checklist
- [ ] Images optimized
- [ ] Components lazy loaded
- [ ] API calls cached
- [ ] Animations use GPU
- [ ] Bundle size checked

---

*Version: 5.0 - Consolidated Guide*
*Last Updated: December 2024*